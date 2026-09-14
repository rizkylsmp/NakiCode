import { describe, expect, it } from "vitest";
import {
  canStartOrderCheckout,
  getOrderPayableAmount,
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

    const balance = makeOrder({
      ...deposit,
      paymentStatus: "partial_paid",
      amountPaid: 2_000_000,
      paymentStage: "balance",
    });
    expect(canStartOrderCheckout(balance)).toBe(true);
    expect(getOrderPayableAmount(balance)).toBe(2_000_000);
  });
});
