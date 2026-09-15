import { beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => ({
  beginTransaction: vi.fn(),
  query: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock("../db", () => ({
  pool: {
    getConnection: vi.fn(async () => connection),
  },
}));

describe("order payment ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connection.beginTransaction.mockResolvedValue(undefined);
    connection.commit.mockResolvedValue(undefined);
    connection.rollback.mockResolvedValue(undefined);
  });

  it("records an accepted custom-project deposit as partially paid", async () => {
    connection.query
      .mockResolvedValueOnce([
        [
          {
            id: 9,
            order_id: 21,
            stage: "deposit",
            status: "waiting_payment",
            amount: 500_000,
            method: "QRIS",
            order_type: "custom_project",
            quote_amount: 1_000_000,
          },
        ],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ paid_total: 500_000 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const { markOrderPaidByPaymentReference } =
      await import("../models/order.model");

    await expect(markOrderPaidByPaymentReference("DP-21")).resolves.toBe(true);
    expect(connection.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("payment_status = ?"),
      [
        "partial_paid",
        500_000,
        "balance",
        "QRIS",
        "DP-21",
        500_000,
        false,
        "in_progress",
        21,
      ],
    );
    expect(connection.commit).toHaveBeenCalledOnce();
  });

  it("unlocks a source purchase only after its full payment settles", async () => {
    connection.query
      .mockResolvedValueOnce([
        [
          {
            id: 10,
            order_id: 22,
            stage: "full",
            status: "waiting_payment",
            amount: 750_000,
            method: "QRIS",
            order_type: "source_purchase",
            quote_amount: null,
          },
        ],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ paid_total: 750_000 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const { markOrderPaidByPaymentReference } =
      await import("../models/order.model");

    await expect(markOrderPaidByPaymentReference("FULL-22")).resolves.toBe(
      true,
    );
    expect(connection.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("payment_status = ?"),
      [
        "paid",
        750_000,
        "complete",
        "QRIS",
        "FULL-22",
        750_000,
        true,
        "completed",
        22,
      ],
    );
  });

  it("keeps an upfront-paid custom project in progress until review approval", async () => {
    connection.query
      .mockResolvedValueOnce([
        [
          {
            id: 11,
            order_id: 23,
            stage: "full",
            status: "waiting_payment",
            amount: 1_000_000,
            method: "QRIS",
            order_type: "custom_project",
            quote_amount: 1_000_000,
          },
        ],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ paid_total: 1_000_000 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const { markOrderPaidByPaymentReference } =
      await import("../models/order.model");

    await expect(markOrderPaidByPaymentReference("FULL-23")).resolves.toBe(
      true,
    );
    expect(connection.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("payment_status = ?"),
      [
        "paid",
        1_000_000,
        "complete",
        "QRIS",
        "FULL-23",
        1_000_000,
        true,
        "in_progress",
        23,
      ],
    );
  });

  it("does not count the same settled reference twice", async () => {
    connection.query.mockResolvedValueOnce([
      [
        {
          id: 10,
          order_id: 22,
          stage: "full",
          status: "paid",
          amount: 750_000,
          method: "QRIS",
          order_type: "source_purchase",
          quote_amount: null,
        },
      ],
    ]);

    const { markOrderPaidByPaymentReference } =
      await import("../models/order.model");

    await expect(markOrderPaidByPaymentReference("FULL-22")).resolves.toBe(
      false,
    );
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
  });
});
