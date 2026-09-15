import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("../db", () => ({
  pool: { query },
}));

describe("terminal payment statuses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
  });

  it.each([
    ["expire", "expired"],
    ["cancel", "cancelled"],
    ["deny", "failed"],
    ["failure", "failed"],
  ])("maps Midtrans %s to %s", async (transactionStatus, expectedStatus) => {
    const { markOrderPaymentFailedByReference } =
      await import("../models/order.model");

    await expect(
      markOrderPaymentFailedByReference("PAYMENT-1", {
        transactionStatus,
        reason: "Terminal payment",
      }),
    ).resolves.toBe(true);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE order_payment_sessions"),
      [
        expectedStatus,
        null,
        "Terminal payment",
        transactionStatus,
        "PAYMENT-1",
      ],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE orders SET payment_status = ?"),
      [
        expectedStatus,
        null,
        "Terminal payment",
        transactionStatus,
        "PAYMENT-1",
      ],
    );
  });
});
