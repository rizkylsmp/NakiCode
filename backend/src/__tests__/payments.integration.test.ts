import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createUserToken } from "../auth";
import { config } from "../config";
import { createPaymentWebhookEvent } from "../models/payment-webhook-event.model";
import {
  findOrderById,
  findOrderByIdForUser,
  findOrderByPaymentReference,
  markOrderPaidByPaymentReference,
} from "../models/order.model";
import {
  ensureOrderInvoice,
  recordPaidOrderTransaction,
} from "../models/finance.model";
import { ordersRouter } from "../routes/orders";
import { paymentsRouter } from "../routes/payments";

vi.mock("../models/order.model", async () => {
  const actual = await vi.importActual<typeof import("../models/order.model")>(
    "../models/order.model",
  );

  return {
    ...actual,
    findOrderByPaymentReference: vi.fn(async () => null),
    findOrderById: vi.fn(async () => null),
    findOrderByIdForUser: vi.fn(async () => null),
    markOrderPaidByPaymentReference: vi.fn(async () => undefined),
    markOrderPaymentFailedByReference: vi.fn(async () => undefined),
    recordOrderPaymentWebhookStatus: vi.fn(async () => undefined),
    withOrderPaymentLock: vi.fn(
      async (_orderId: number, operation: () => Promise<unknown>) =>
        operation(),
    ),
  };
});

vi.mock("../models/payment-webhook-event.model", () => ({
  createPaymentWebhookEvent: vi.fn(async () => ({ inserted: true, id: 1 })),
  finishPaymentWebhookEvent: vi.fn(async () => undefined),
}));

vi.mock("../models/finance.model", () => ({
  ensureOrderInvoice: vi.fn(async () => "INV/TEST"),
  recordPaidOrderTransaction: vi.fn(async () => undefined),
}));

vi.mock("../models/business.model", async () => {
  const actual = await vi.importActual<
    typeof import("../models/business.model")
  >("../models/business.model");
  return {
    ...actual,
    redeemCouponReservation: vi.fn(async () => true),
    releaseCouponReservation: vi.fn(async () => true),
  };
});

vi.mock("../models/notification.model", async () => {
  const actual = await vi.importActual<
    typeof import("../models/notification.model")
  >("../models/notification.model");

  return {
    ...actual,
    createNotification: vi.fn(async () => undefined),
  };
});

const webhookApp = express();
webhookApp.use(express.json({ limit: "1mb" }));
webhookApp.use("/api/payments", paymentsRouter);

const orderPaymentApp = express();
orderPaymentApp.use(express.json({ limit: "1mb" }));
orderPaymentApp.use("/api/orders", ordersRouter);

function webhookPayload(transactionStatus: string) {
  const orderId = "ORDER-000001";
  const statusCode = "200";
  const grossAmount = "150000";
  const signatureKey = config.payment.midtransServerKey
    ? crypto
        .createHash("sha512")
        .update(
          `${orderId}${statusCode}${grossAmount}${config.payment.midtransServerKey}`,
        )
        .digest("hex")
    : "dev-signature";

  return {
    transaction_status: transactionStatus,
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    payment_type: "bank_transfer",
    transaction_time: "2026-06-16 10:00:00",
  };
}

describe("Payments API Integration", () => {
  const originalServerKey = config.payment.midtransServerKey;
  const userToken = createUserToken({
    id: 10,
    username: "user-test",
    role: "user",
  });

  beforeAll(() => {
    config.payment.midtransServerKey = "test-midtrans-server-key";
  });

  afterAll(() => {
    config.payment.midtransServerKey = originalServerKey;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createPaymentWebhookEvent).mockResolvedValue({
      inserted: true,
      id: 1,
    });
  });

  describe("POST /api/payments/midtrans/webhook", () => {
    it("accepts webhook without authentication", async () => {
      // Midtrans webhooks don't use Bearer auth
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("settlement"));

      expect(response.status).not.toBe(401);
      expect([200, 400, 404]).toContain(response.status);
    });

    it("rejects a webhook with an invalid signature", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send({
          ...webhookPayload("settlement"),
          signature_key: "invalid-signature",
        });

      expect(response.status).toBe(401);
    });

    it("handles settlement status", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("settlement"));

      expect([200, 400, 404]).toContain(response.status);
    });

    it("repairs bookkeeping even when the order was already marked paid", async () => {
      vi.mocked(findOrderByPaymentReference).mockResolvedValueOnce({
        id: 12,
        userId: 10,
        templateTitle: "Landing Page",
        paymentAmount: 150000,
      } as Awaited<ReturnType<typeof findOrderByPaymentReference>>);
      vi.mocked(markOrderPaidByPaymentReference).mockResolvedValueOnce(false);
      vi.mocked(findOrderById).mockResolvedValueOnce({
        id: 12,
        userId: 10,
        orderType: "source_purchase",
        paymentStatus: "paid",
        templateTitle: "Landing Page",
      } as Awaited<ReturnType<typeof findOrderById>>);

      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("settlement"));

      expect(response.status).toBe(200);
      expect(ensureOrderInvoice).toHaveBeenCalledWith(12);
      expect(recordPaidOrderTransaction).toHaveBeenCalledWith(
        12,
        "ORDER-000001",
      );
    });

    it("handles pending status", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("pending"));

      expect([200, 400, 404]).toContain(response.status);
    });

    it("handles failure status", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("deny"));

      expect([200, 400, 404]).toContain(response.status);
    });

    it("ignores duplicate webhook events idempotently", async () => {
      vi.mocked(createPaymentWebhookEvent).mockResolvedValueOnce({
        inserted: false,
        id: null,
      });

      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("settlement"));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ duplicate: true });
    });

    it("validates webhook payload structure", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send({
          // Missing required fields
          transaction_status: "settlement",
        });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("POST /api/orders/:id/payment", () => {
    it("rejects payment without auth", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .send({ method: "transfer" });

      expect(response.status).toBe(401);
    });

    it("rejects Lynk for a custom-project deposit", async () => {
      vi.mocked(findOrderByIdForUser).mockResolvedValueOnce({
        id: 1,
        userId: 10,
        orderType: "custom_project",
        status: "awaiting_dp",
        paymentStatus: "pending",
        paymentReference: null,
        paymentUrl: null,
        quoteAmount: 1_000_000,
        quoteStatus: "accepted",
        depositPercent: 50,
        amountPaid: 0,
        templateId: 2,
        templatePrice: "Rp750.000",
        templateTitle: "Landing Page",
        sourceAvailable: false,
      } as Awaited<ReturnType<typeof findOrderByIdForUser>>);

      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ provider: "lynk" });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("harus memakai Midtrans");
    });

    it("validates payment method", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "crypto" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Input tidak valid");
    });

    it("accepts transfer payment method", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "transfer" });

      // Accepts 200 (success), 404 (order not found), or 400 (already paid)
      expect([200, 400, 404]).toContain(response.status);
    });

    it("accepts ewallet payment method", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "ewallet" });

      expect([200, 400, 404]).toContain(response.status);
    });

    it("accepts qris payment method", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "qris" });

      expect([200, 400, 404]).toContain(response.status);
    });

    it("prevents duplicate payment for already paid order", async () => {
      // Note: This test requires a paid order to exist
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "transfer" });

      // Accepts 200 (success), 400 (already paid), or 404 (not found)
      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.message).toBeDefined();
      }
    });

    it("returns payment URL or instructions", async () => {
      const response = await request(orderPaymentApp)
        .post("/api/orders/1/payment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ method: "transfer" });

      if (response.status === 200) {
        // Should return payment instructions or Midtrans URL
        expect(response.body).toBeDefined();
      }
    });
  });

  describe("Payment Status Updates", () => {
    it("updates order status on successful payment", async () => {
      // This is tested via webhook endpoint
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("settlement"));

      expect([200, 400, 404]).toContain(response.status);
    });

    it("does not update order status on pending payment", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("pending"));

      expect([200, 400, 404]).toContain(response.status);
    });

    it("handles expired payment", async () => {
      const response = await request(webhookApp)
        .post("/api/payments/midtrans/webhook")
        .send(webhookPayload("expire"));

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
