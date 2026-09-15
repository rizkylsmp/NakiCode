import { describe, expect, it } from "vitest";
import {
  canRateOrder,
  canStartOrderCheckout,
  getOrderPaymentActionLabel,
  getOrderPayableAmount,
  getPaymentMethodLabel,
  type OrderItem,
} from "./order-types";

function makeOrder(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 1,
    userId: 10,
    templateId: 3,
    templateSlug: "landing-page",
    templateTitle: "Landing Page",
    customerName: "NAKI User",
    customerContact: "user@example.com",
    projectType: "Design",
    budgetRange: "Rp1.000.000",
    message: "Brief",
    orderType: "source_purchase",
    status: "quotation",
    paymentStatus: "pending",
    paymentMethod: null,
    paymentReference: null,
    paymentUrl: null,
    paymentExpiresAt: null,
    paymentAmount: null,
    subtotalAmount: null,
    discountAmount: 0,
    gatewayFeeAmount: 0,
    netAmount: null,
    currency: "IDR",
    quoteAmount: null,
    quoteNotes: null,
    quoteSentAt: null,
    quoteStatus: null,
    quoteRespondedAt: null,
    depositPercent: 50,
    amountPaid: 0,
    paymentStage: "full",
    deliveryDemoUrl: null,
    deliverySourceUrl: null,
    finalSourceReady: false,
    deliveryNotes: null,
    deliveryReviewStatus: null,
    deliverySubmittedAt: null,
    deliveryReviewedAt: null,
    revisionNotes: null,
    revisionFiles: [],
    remainingAmount: 0,
    invoiceNumber: null,
    invoiceIssuedAt: null,
    paymentFailureCode: null,
    paymentFailureReason: null,
    paymentLastWebhookStatus: null,
    paymentLastWebhookAt: null,
    paidAt: null,
    settlementAt: null,
    refundedAt: null,
    cancelledAt: null,
    templatePrice: "Rp750.000",
    templateLynkUrl: null,
    deliveryStatus: "locked",
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
    createdAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("order checkout rules", () => {
  it("uses a neutral customer-facing label for the payment gateway", () => {
    expect(getPaymentMethodLabel("Midtrans")).toBe("Payment gateway");
    expect(getPaymentMethodLabel("Midtrans (dev)")).toBe("Payment gateway");
    expect(getPaymentMethodLabel("Lynk")).toBe("Lynk");
  });

  it("only opens rating after the order is completed", () => {
    expect(
      canRateOrder(makeOrder({ paymentStatus: "paid", status: "delivered" })),
    ).toBe(false);
    expect(
      canRateOrder(makeOrder({ paymentStatus: "paid", status: "completed" })),
    ).toBe(true);
  });

  it("uses the catalog price for a source purchase", () => {
    const order = makeOrder({
      quoteAmount: 1_250_000,
      quoteStatus: "accepted",
    });
    expect(getOrderPayableAmount(order)).toBe(750_000);
    expect(canStartOrderCheckout(order)).toBe(true);
  });

  it("blocks checkout until a quote is accepted", () => {
    expect(
      canStartOrderCheckout(
        makeOrder({
          orderType: "custom_project",
          quoteAmount: 1_250_000,
          quoteStatus: "pending",
        }),
      ),
    ).toBe(false);
  });

  it("does not allow a second session while payment is waiting", () => {
    expect(
      canStartOrderCheckout(makeOrder({ paymentStatus: "waiting_payment" })),
    ).toBe(false);
  });

  it("charges a custom project as deposit then remaining balance", () => {
    const deposit = makeOrder({
      orderType: "custom_project",
      quoteAmount: 4_000_000,
      quoteStatus: "accepted",
      depositPercent: 50,
      paymentStage: "deposit",
    });
    expect(getOrderPayableAmount(deposit)).toBe(2_000_000);
    expect(getOrderPayableAmount(deposit, "full")).toBe(4_000_000);

    const balance = makeOrder({
      ...deposit,
      paymentStatus: "partial_paid",
      amountPaid: 2_000_000,
      paymentStage: "balance",
      status: "awaiting_balance",
    });
    expect(canStartOrderCheckout(balance)).toBe(true);
    expect(getOrderPayableAmount(balance)).toBe(2_000_000);
  });

  it("offers a fresh payment after expiry without charging the DP twice", () => {
    const expiredDeposit = makeOrder({
      orderType: "custom_project",
      paymentStatus: "expired",
      quoteAmount: 4_000_000,
      quoteStatus: "accepted",
      depositPercent: 50,
      amountPaid: 0,
    });
    expect(canStartOrderCheckout(expiredDeposit)).toBe(true);
    expect(getOrderPaymentActionLabel(expiredDeposit)).toBe(
      "Ulangi pembayaran DP 50%",
    );
    expect(getOrderPayableAmount(expiredDeposit)).toBe(2_000_000);

    const expiredBalance = makeOrder({
      ...expiredDeposit,
      amountPaid: 2_000_000,
      paymentStage: "balance",
      status: "awaiting_balance",
    });
    expect(getOrderPaymentActionLabel(expiredBalance)).toBe("Ulangi pelunasan");
    expect(getOrderPayableAmount(expiredBalance)).toBe(2_000_000);
  });

  it("offers retry after a source payment is cancelled while the order remains active", () => {
    const cancelledOrder = makeOrder({
      paymentStatus: "cancelled",
      status: "new",
    });

    expect(canStartOrderCheckout(cancelledOrder)).toBe(true);
    expect(getOrderPaymentActionLabel(cancelledOrder)).toBe("Bayar ulang");
  });

  it("does not silently reopen an order cancelled by admin", () => {
    expect(
      canStartOrderCheckout(
        makeOrder({ paymentStatus: "cancelled", status: "cancelled" }),
      ),
    ).toBe(false);
  });

  it("keeps custom balance locked until the delivered result is approved", () => {
    const partial = makeOrder({
      orderType: "custom_project",
      paymentStatus: "partial_paid",
      quoteAmount: 500_000,
      quoteStatus: "accepted",
      amountPaid: 250_000,
      status: "in_progress",
    });
    expect(canStartOrderCheckout(partial)).toBe(false);
    expect(
      canStartOrderCheckout({ ...partial, status: "awaiting_balance" }),
    ).toBe(true);
  });
});
