import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderItem } from "../models/order.model";

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  markFailed: vi.fn(),
  markPaid: vi.fn(),
  recordStatus: vi.fn(),
  notify: vi.fn(),
  releaseCoupon: vi.fn(),
  redeemCoupon: vi.fn(),
  ensureInvoice: vi.fn(),
  recordTransaction: vi.fn(),
}));

vi.mock("./payment.service", () => ({
  getMidtransTransactionStatus: mocks.getStatus,
}));
vi.mock("../models/order.model", () => ({
  markOrderPaymentFailedByReference: mocks.markFailed,
  markOrderPaidByPaymentReference: mocks.markPaid,
  recordOrderPaymentWebhookStatus: mocks.recordStatus,
}));
vi.mock("../models/notification.model", () => ({
  createNotification: mocks.notify,
}));
vi.mock("../models/business.model", () => ({
  releaseCouponReservation: mocks.releaseCoupon,
  redeemCouponReservation: mocks.redeemCoupon,
}));
vi.mock("../models/finance.model", () => ({
  ensureOrderInvoice: mocks.ensureInvoice,
  recordPaidOrderTransaction: mocks.recordTransaction,
}));

import { reconcileWaitingMidtransOrder } from "./midtrans-reconciliation.service";

function waitingOrder(overrides: Partial<OrderItem> = {}) {
  return {
    id: 66,
    userId: 7,
    templateTitle: "NAKI Design",
    orderType: "custom_project",
    paymentStatus: "waiting_payment",
    paymentMethod: "QRIS",
    paymentReference: "NKC-66-TEST",
    paymentAmount: 250_000,
    amountPaid: 0,
    ...overrides,
  } as OrderItem;
}

describe("Midtrans payment reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markFailed.mockResolvedValue(true);
    mocks.markPaid.mockResolvedValue(true);
  });

  it("stops a local countdown when Midtrans reports expire", async () => {
    mocks.getStatus.mockResolvedValue({
      orderId: "NKC-66-TEST",
      statusCode: "407",
      transactionStatus: "expire",
      fraudStatus: null,
      grossAmount: "250000.00",
      statusMessage: "Success, transaction is found",
    });
    await expect(
      reconcileWaitingMidtransOrder(waitingOrder()),
    ).resolves.toBe(true);
    expect(mocks.markFailed).toHaveBeenCalledWith("NKC-66-TEST", {
      code: "407",
      reason: "Waktu pembayaran Midtrans telah kedaluwarsa",
      transactionStatus: "expire",
    });
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pembayaran kedaluwarsa" }),
    );
  });

  it("marks a matching settlement as paid when webhook cannot reach localhost", async () => {
    mocks.getStatus.mockResolvedValue({
      orderId: "NKC-66-TEST",
      statusCode: "200",
      transactionStatus: "settlement",
      fraudStatus: "accept",
      grossAmount: "250000.00",
      statusMessage: "Success",
    });
    await expect(
      reconcileWaitingMidtransOrder(waitingOrder()),
    ).resolves.toBe(true);
    expect(mocks.markPaid).toHaveBeenCalledWith("NKC-66-TEST");
    expect(mocks.getStatus).toHaveBeenCalledWith(
      "NKC-66-TEST",
      undefined,
    );
    expect(mocks.ensureInvoice).toHaveBeenCalledWith(66);
    expect(mocks.recordTransaction).toHaveBeenCalledWith(66, "NKC-66-TEST");
  });
});
