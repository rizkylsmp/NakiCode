import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}));
const query = dbMock.query;

vi.mock("../db", () => ({
  pool: {
    query,
  },
}));

describe("order model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);
  });

  it("only accepts ratings from completed paid orders", async () => {
    query.mockReset();
    query.mockResolvedValueOnce([[]]);
    const { hasSuccessfulTemplateOrder } = await import("../models/order.model");

    await expect(hasSuccessfulTemplateOrder(17, 8)).resolves.toBe(false);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("status IN ('completed', 'closed')"),
      [17, 8],
    );
  });

  it("applies admin order status and payment status filters to count and page queries", async () => {
    const { findOrdersPage } = await import("../models/order.model");

    await findOrdersPage(2, 8, {
      status: "deal",
      paymentStatus: "paid",
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "order_rows.payment_expires_at <= CURRENT_TIMESTAMP",
      ),
      [],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "WHERE orders.deleted_at IS NULL AND orders.status = ? AND orders.payment_status = ?",
      ),
      ["deal", "paid"],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        "WHERE orders.deleted_at IS NULL AND orders.status = ? AND orders.payment_status = ?",
      ),
      ["deal", "paid", 8, 8],
    );
  });

  it("keeps admin order queries unfiltered when filters are omitted", async () => {
    const { findOrdersPage } = await import("../models/order.model");

    await findOrdersPage(1, 10);

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("WHERE orders.deleted_at IS NULL"),
      [],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("WHERE orders.deleted_at IS NULL"),
      [10, 0],
    );
    expect(query.mock.calls[1][0]).not.toContain("orders.status = ?");
    expect(query.mock.calls[1][0]).not.toContain("orders.payment_status = ?");
  });

  it("filters cancelled user payments separately from other unpaid orders", async () => {
    const { findOrdersPageByUser } = await import("../models/order.model");

    await findOrdersPageByUser(17, 1, 6, "cancelled");

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "WHERE orders.user_id = ? AND orders.deleted_at IS NULL AND (orders.payment_status = 'cancelled' OR orders.status = 'cancelled')",
      ),
      [17],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        "WHERE orders.user_id = ? AND orders.deleted_at IS NULL AND (orders.payment_status = 'cancelled' OR orders.status = 'cancelled')",
      ),
      [17, 6, 0],
    );
  });

  it.each([
    ["work", "orders.status IN ('in_progress', 'revision')"],
    ["review", "orders.status = 'delivered' AND orders.delivery_review_status = 'pending'"],
    ["balance", "orders.status = 'awaiting_balance'"],
    ["completed", "orders.status = 'completed'"],
  ] as const)("filters the %s user workflow menu", async (filter, sql) => {
    const { findOrdersPageByUser } = await import("../models/order.model");

    await findOrdersPageByUser(17, 1, 6, filter);

    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining(sql), [17]);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining(sql), [
      17,
      6,
      0,
    ]);
  });

  it("keeps the final source URL out of user responses until completion", async () => {
    query.mockReset();
    const baseRow = {
      id: 66,
      user_id: 17,
      design_slug: "custom-site",
      design_title: "Custom Site",
      customer_name: "NAKI User",
      customer_contact: "user@example.com",
      project_type: "Website",
      budget_range: "Rp1.000.000",
      message: "Custom project",
      order_type: "custom_project",
      payment_status: "partial_paid",
      amount_paid: 500_000,
      quote_amount: 1_000_000,
      delivery_source_url: "/uploads/source/final.zip",
      created_at: "2026-09-14T08:00:00.000Z",
    };
    query
      .mockResolvedValueOnce([[{ ...baseRow, status: "delivered" }]])
      .mockResolvedValueOnce([
        [
          {
            ...baseRow,
            status: "completed",
            payment_status: "paid",
            amount_paid: 1_000_000,
          },
        ],
      ]);
    const { findOrderByIdForUser } = await import("../models/order.model");

    const reviewOrder = await findOrderByIdForUser(66, 17);
    const completedOrder = await findOrderByIdForUser(66, 17);

    expect(reviewOrder).toMatchObject({
      finalSourceReady: true,
      deliverySourceUrl: null,
      status: "delivered",
    });
    expect(completedOrder).toMatchObject({
      finalSourceReady: true,
      deliverySourceUrl: "/uploads/source/final.zip",
      status: "completed",
    });
  });
});
