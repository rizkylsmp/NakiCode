import { describe, expect, it } from "vitest";
import {
  canStartOrderPayment,
  canTransitionOrderStatus,
} from "../order-workflow";

describe("order workflow guards", () => {
  it("rejects unsafe jumps and paid cancellation", () => {
    expect(canTransitionOrderStatus("new", "completed", "pending")).toBe(false);
    expect(canTransitionOrderStatus("new", "contacted", "pending")).toBe(true);
    expect(canTransitionOrderStatus("in_progress", "cancelled", "paid")).toBe(
      false,
    );
    expect(
      canTransitionOrderStatus("awaiting_dp", "cancelled", "waiting_payment"),
    ).toBe(false);
  });

  it("returns a revision request from review to the work stage", () => {
    expect(
      canTransitionOrderStatus("delivered", "in_progress", "partial_paid"),
    ).toBe(true);
    expect(
      canTransitionOrderStatus("delivered", "revision", "partial_paid"),
    ).toBe(false);
  });

  it("requires an accepted quote and a restartable payment state", () => {
    expect(
      canStartOrderPayment({
        orderType: "custom_project",
        status: "quotation",
        paymentStatus: "pending",
        quoteAmount: 500_000,
        quoteStatus: "pending",
      }),
    ).toBe(false);
    expect(
      canStartOrderPayment({
        orderType: "custom_project",
        status: "in_progress",
        paymentStatus: "partial_paid",
        quoteAmount: 500_000,
        quoteStatus: "accepted",
      }),
    ).toBe(false);
    expect(
      canStartOrderPayment({
        orderType: "custom_project",
        status: "awaiting_balance",
        paymentStatus: "partial_paid",
        quoteAmount: 500_000,
        quoteStatus: "accepted",
      }),
    ).toBe(true);
    expect(
      canStartOrderPayment({
        orderType: "custom_project",
        status: "awaiting_dp",
        paymentStatus: "pending",
        quoteAmount: 500_000,
        quoteStatus: "accepted",
      }),
    ).toBe(true);
    expect(
      canStartOrderPayment({
        orderType: "custom_project",
        status: "awaiting_dp",
        paymentStatus: "waiting_payment",
        quoteAmount: 500_000,
        quoteStatus: "accepted",
      }),
    ).toBe(false);
  });
});
