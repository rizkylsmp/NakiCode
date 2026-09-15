import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPage } from "../CheckoutPage";
import { renderWithProviders } from "../../test/render";

vi.mock("../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../services/api-client")
  >("../../services/api-client");

  return {
    ...actual,
    apiGet: vi.fn(async (path: string) => {
      if (path === "/api/orders/my/66") {
        return {
          order: {
            id: 66,
            templateId: 1,
            templateSlug: "naki-nightfall",
            templateTitle: "Naki Nightfall",
            customerName: "NAKI User",
            customerContact: "user@example.com",
            projectType: "Website",
            budgetRange: "Rp500.000",
            message: "Brief",
            orderType: "source_purchase",
            status: "new",
            paymentStatus: "pending",
            paymentMethod: null,
            paymentReference: null,
            paymentUrl: null,
            paymentExpiresAt: null,
            paymentAmount: null,
            subtotalAmount: 500_000,
            discountAmount: 0,
            gatewayFeeAmount: 0,
            netAmount: 500_000,
            currency: "IDR",
            quoteAmount: null,
            quoteNotes: null,
            quoteSentAt: null,
            quoteStatus: null,
            quoteRespondedAt: null,
            depositPercent: 50,
            amountPaid: 0,
            paymentStage: "full",
            remainingAmount: 500_000,
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
            templatePrice: "Rp500.000",
            templateLynkUrl: null,
            deliveryStatus: "locked",
            sourceCodeItems: [],
            setupGuide: null,
            demoUrl: null,
            createdAt: "2026-09-14T00:00:00.000Z",
          },
        };
      }

      return { notifications: [] };
    }),
    apiPost: vi.fn(),
  };
});

describe("CheckoutPage", () => {
  it("disables Lynk when admin has not configured its URL", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
      </Routes>,
      {
        auth: { token: "user-token", username: "naki-user", role: "user" },
        route: "/checkout/66",
      },
    );

    const lynkButton = await screen.findByRole("button", { name: /via lynk/i });

    expect(lynkButton).toBeDisabled();
    expect(lynkButton).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText(/midtrans/i)).not.toBeInTheDocument();
  });
});
