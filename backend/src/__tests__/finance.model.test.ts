import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../db", () => ({
  pool: dbMock,
}));

describe("finance model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("backfills missing paid orders with an idempotent bookkeeping query", async () => {
    dbMock.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 2 }]);
    const { syncPaidOrderTransactions } =
      await import("../models/finance.model");

    await expect(syncPaidOrderTransactions()).resolves.toBe(3);
    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining("payments.status = 'paid'"),
    );
    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "orders.payment_status IN ('paid', 'partial_refunded', 'refunded')",
      ),
    );
    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining("transactions.id IS NULL"),
    );
  });
});
