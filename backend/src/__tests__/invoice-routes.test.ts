import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  order: vi.fn(),
  list: vi.fn(),
  find: vi.fn(),
  backfill: vi.fn(),
  pdf: vi.fn(),
}));
vi.mock("../auth", () => ({
  requireUser: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (!req.header("authorization")) {
      res.status(401).json({ message: "Login diperlukan" });
      return;
    }
    res.locals.user = { userId: 10 };
    next();
  },
  requireAdmin: vi.fn(),
}));
vi.mock("../models/order.model", () => ({ findOrderByIdForUser: mocks.order }));
vi.mock("../models/invoice.model", () => ({
  backfillStageInvoices: mocks.backfill,
  findStageInvoices: mocks.list,
  findStageInvoice: mocks.find,
  invoiceStageLabels: {
    deposit: "Down Payment (DP)",
    balance: "Pelunasan",
    full: "Pembayaran penuh",
  },
}));
vi.mock("../order-email.service", () => ({
  invoicePdfData: (value: unknown) => value,
}));
vi.mock("../utils/generateInvoice", () => ({
  generateInvoiceBuffer: mocks.pdf,
}));
import { ordersRouter } from "../routes/orders";
const app = express();
app.use(express.json());
app.use("/api/orders", ordersRouter);
const invoice = {
  id: 3,
  orderId: 1,
  stage: "deposit",
  totalAmount: 2500000,
  status: "waiting_payment",
  snapshot: { customerEmail: "secret@example.com" },
};
describe("stage invoice access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pdf.mockResolvedValue(Buffer.from("%PDF-1.3"));
  });
  it("requires login", async () => {
    expect((await request(app).get("/api/orders/1/invoices")).status).toBe(401);
  });
  it("does not expose another user's invoices", async () => {
    mocks.order.mockResolvedValue(null);
    const response = await request(app)
      .get("/api/orders/1/invoice?stage=deposit")
      .set("Authorization", "Bearer test");
    expect(response.status).toBe(404);
    expect(mocks.order).toHaveBeenCalledWith(1, 10);
    expect(mocks.backfill).not.toHaveBeenCalled();
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it("lists safe invoice metadata without private snapshots", async () => {
    mocks.order.mockResolvedValue({ id: 1 });
    mocks.list.mockResolvedValue([invoice]);
    const response = await request(app)
      .get("/api/orders/1/invoices")
      .set("Authorization", "Bearer test");
    expect(response.status).toBe(200);
    expect(response.body.invoices[0].label).toBe("Down Payment (DP)");
    expect(response.body.invoices[0]).not.toHaveProperty("snapshot");
  });
  it("allows downloading an issued DP before payment without claiming it is paid", async () => {
    mocks.order.mockResolvedValue({ id: 1 });
    mocks.find.mockResolvedValue(invoice);
    const response = await request(app)
      .get("/api/orders/1/invoice?stage=deposit")
      .set("Authorization", "Bearer test");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(mocks.pdf).toHaveBeenCalledWith(
      expect.objectContaining({ status: "waiting_payment" }),
    );
  });
  it("rejects unavailable or invalid stages", async () => {
    mocks.order.mockResolvedValue({ id: 1 });
    mocks.find.mockResolvedValue(null);
    expect(
      (
        await request(app)
          .get("/api/orders/1/invoice?stage=balance")
          .set("Authorization", "Bearer test")
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get("/api/orders/1/invoice?stage=invalid")
          .set("Authorization", "Bearer test")
      ).status,
    ).toBe(400);
  });
});
