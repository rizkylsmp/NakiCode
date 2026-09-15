import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserToken } from "../auth";
import { financeRouter } from "../routes/finance";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(async () => undefined),
  categories: vi.fn(async () => []),
  summary: vi.fn(async () => ({
    income: 0,
    expense: 0,
    refunds: 0,
    fees: 0,
    netProfit: 0,
  })),
  transactions: vi.fn(async () => ({
    transactions: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  })),
  reconcile: vi.fn(async () => 2),
}));

vi.mock("../models/audit-log.model", () => ({
  createAdminAuditLog: mocks.audit,
}));

vi.mock("../models/finance.model", () => ({
  createExpense: vi.fn(),
  findFinanceCategories: mocks.categories,
  findFinanceSummary: mocks.summary,
  findFinanceTransactions: mocks.transactions,
  recordOrderRefund: vi.fn(),
  syncPaidOrderTransactions: mocks.reconcile,
  updateExpense: vi.fn(),
  voidExpense: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/api/finance", financeRouter);
const adminToken = createUserToken({ id: 1, username: "admin", role: "admin" });

describe("Finance API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads transactions without running a blocking reconciliation", async () => {
    const response = await request(app)
      .get("/api/finance/transactions?from=2026-09-01&to=2026-09-30")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });

  it("runs reconciliation explicitly and audits it", async () => {
    const response = await request(app)
      .post("/api/finance/reconcile")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ synced: 2 });
    expect(mocks.reconcile).toHaveBeenCalledOnce();
    expect(mocks.audit).toHaveBeenCalledOnce();
  });

  it("exports every transaction page without silently truncating the report", async () => {
    const transaction = (id: number) => ({
      id,
      orderId: null,
      categoryId: null,
      categoryName: null,
      type: "income" as const,
      amount: 100_000,
      gatewayFee: 0,
      netAmount: 100_000,
      paymentMethod: "bank_transfer",
      reference: `PAY-${id}`,
      occurredAt: "2026-09-15T03:00:00.000Z",
      notes: null,
    });
    mocks.transactions
      .mockResolvedValueOnce({
        transactions: [transaction(1)],
        page: 1,
        pageSize: 1000,
        total: 2,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        transactions: [transaction(2)],
        page: 2,
        pageSize: 1000,
        total: 2,
        totalPages: 2,
      });

    const response = await request(app)
      .get("/api/finance/reports.csv?from=2026-09-01&to=2026-09-30")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("PAY-1");
    expect(response.text).toContain("PAY-2");
    expect(mocks.transactions).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2, pageSize: 1000 }),
    );
  });
});
