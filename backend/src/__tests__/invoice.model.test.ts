import { beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ pool: { query } }));
import {
  ensureBalanceInvoice,
  ensurePaymentStageInvoice,
} from "../models/invoice.model";

const session = {
  id: 1,
  stage: "deposit",
  subtotal_amount: 2500000,
  discount_amount: 0,
  amount: 2500000,
  status: "waiting_payment",
  created_at: "2026-09-29T00:00:00Z",
  currency: "IDR",
  order_type: "custom_project",
  quote_amount: 5000000,
  customer_name: "Buyer",
  customer_contact: "untrusted@example.com",
  customer_email: "account@example.com",
  design_title: "Business Website",
  project_type: "custom",
  previous_paid: 0,
  reference: "NKC-1-DP",
};

describe("stage invoices", () => {
  beforeEach(() => vi.resetAllMocks());
  it.each([
    ["deposit", "DP", 2500000],
    ["balance", "BAL", 2500000],
    ["full", "FULL", 5000000],
  ])(
    "creates a separate %s invoice using the trusted payment session",
    async (stage, code, amount) => {
      query
        .mockResolvedValueOnce([
          [{ ...session, stage, amount, subtotal_amount: amount }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[]]);
      await ensurePaymentStageInvoice(1, "NKC-1-DP");
      const [sql, values] = query.mock.calls[1];
      expect(sql).toContain("ON DUPLICATE KEY UPDATE");
      expect(sql).toContain(
        "status IN ('paid', 'refunded', 'partial_refunded')",
      );
      expect(values[1]).toBe(stage);
      expect(values[2]).toBe(`INV/2026/09/000001/${code}`);
      expect(values[5]).toBe(amount);
      expect(JSON.parse(values[8])).toMatchObject({
        customerEmail: "account@example.com",
        orderTotal: 5000000,
      });
    },
  );
  it("does not create a balance invoice before review approval", async () => {
    query.mockResolvedValueOnce([[]]);
    expect(await ensureBalanceInvoice(1)).toBeNull();
    expect(query.mock.calls[0][0]).toContain(
      "orders.delivery_review_status = 'approved'",
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
  it("bills only the remaining settlement amount after approval", async () => {
    query
      .mockResolvedValueOnce([
        [
          {
            ...session,
            settled_count: 1,
            settled_amount: 2500000,
            amount_paid: 5000000,
          },
        ],
      ])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[]]);
    await ensureBalanceInvoice(1);
    expect(query.mock.calls[2][1][5]).toBe(2500000);
    expect(JSON.parse(query.mock.calls[2][1][8]).previousPaid).toBe(2500000);
  });
  it("does not bill a fully paid project again", async () => {
    query.mockResolvedValueOnce([
      [{ ...session, settled_amount: 5000000, amount_paid: 5000000 }],
    ]);
    expect(await ensureBalanceInvoice(1)).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
