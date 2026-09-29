import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  send: vi.fn(),
  find: vi.fn(),
  ensure: vi.fn(),
  balance: vi.fn(),
  enqueue: vi.fn(),
  pdf: vi.fn(),
}));
vi.mock("../db", () => ({ pool: { query: mocks.query } }));
vi.mock("../config", () => ({
  config: { clientOrigin: "https://www.nakicode.xyz" },
}));
vi.mock("../email", () => ({ sendOrderEmail: mocks.send }));
vi.mock("../email-queue", () => ({ enqueueEmail: mocks.enqueue }));
vi.mock("../models/invoice.model", () => ({
  findStageInvoice: mocks.find,
  ensurePaymentStageInvoice: mocks.ensure,
  ensureBalanceInvoice: mocks.balance,
  invoiceStageLabels: {
    deposit: "Down Payment (DP)",
    balance: "Pelunasan",
    full: "Pembayaran penuh",
  },
}));
vi.mock("../utils/generateInvoice", () => ({
  generateInvoiceBuffer: mocks.pdf,
}));
import {
  deliverOrderEmails,
  notifyOrderCreated,
  syncPaymentInvoice,
} from "../order-email.service";

const invoice = {
  id: 3,
  orderId: 1,
  stage: "deposit",
  invoiceNumber: "INV/2026/09/000001/DP",
  subtotalAmount: 2500000,
  discountAmount: 0,
  totalAmount: 2500000,
  currency: "IDR",
  status: "paid",
  issuedAt: "2026-09-29",
  snapshot: {
    customerEmail: "account@example.com",
    customerName: "Buyer",
    designTitle: "Website",
    orderTotal: 5000000,
    previousPaid: 0,
  },
};
describe("order invoice email delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pdf.mockResolvedValue(Buffer.from("%PDF"));
  });
  function setup(eventKey = "deposit-paid", status = "paid") {
    mocks.query
      .mockResolvedValueOnce([
        [{ id: 7, order_id: 1, invoice_id: 3, event_key: eventKey }],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([
        [
          {
            id: 1,
            customer_name: "Buyer",
            email: "account@example.com",
            order_type: "custom_project",
          },
        ],
      ])
      .mockResolvedValue([{ affectedRows: 1 }]);
    mocks.find.mockResolvedValue({ ...invoice, status });
  }
  it("sends a stage PDF only to the order account email", async () => {
    setup();
    await deliverOrderEmails(1);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "account@example.com",
        subject: expect.stringContaining("Down Payment"),
        url: "https://www.nakicode.xyz/pesanan-saya",
        attachment: {
          filename: "invoice-1-deposit.pdf",
          content: Buffer.from("%PDF"),
        },
      }),
    );
    expect(mocks.query.mock.calls.at(-1)?.[0]).toContain("status = 'sent'");
  });
  it("does not send when another worker already claimed the email", async () => {
    mocks.query
      .mockResolvedValueOnce([[{ id: 7 }]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);
    await deliverOrderEmails(1);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("retains failed SMTP delivery for retry", async () => {
    setup();
    mocks.send.mockRejectedValue(new Error("SMTP unavailable"));
    await expect(deliverOrderEmails(1)).rejects.toThrow("SMTP unavailable");
    expect(mocks.query.mock.calls.at(-1)?.[0]).toContain("status = 'pending'");
  });
  it("does not send an outdated unpaid invoice after settlement", async () => {
    setup("deposit-issued");
    await deliverOrderEmails(1);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.at(-1)?.[0]).toContain("superseded");
  });
  it("does not reject successful order creation if email fails", async () => {
    mocks.query.mockResolvedValue([{ affectedRows: 1 }]);
    mocks.enqueue.mockRejectedValue(new Error("SMTP unavailable"));
    await expect(notifyOrderCreated(1)).resolves.toBeUndefined();
  });
  it("does not send an outdated paid receipt after a refund", async () => {
    setup("deposit-paid", "refunded");
    await deliverOrderEmails(1);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.at(-1)?.[0]).toContain("superseded");
  });
  it("uses an idempotent email event when settlement callbacks repeat", async () => {
    mocks.ensure.mockResolvedValue(invoice);
    mocks.query.mockResolvedValue([{ affectedRows: 0 }]);
    await syncPaymentInvoice(1, "NKC-1-DP");
    await syncPaymentInvoice(1, "NKC-1-DP");
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT IGNORE"),
      [1, 3, "deposit-paid"],
    );
  });
});
