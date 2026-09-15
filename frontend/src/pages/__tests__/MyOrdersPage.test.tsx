import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MyOrdersPage } from "../MyOrdersPage";
import { renderWithProviders } from "../../test/render";

vi.mock("../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../services/api-client")
  >("../../services/api-client");

  return {
    ...actual,
    apiGet: vi.fn(async (path: string) => {
      if (path.startsWith("/api/orders/my?")) {
        return {
          orders: [
            {
              id: 17,
              templateId: 1,
              templateSlug: "naki-nightfall",
              templateTitle: "Naki Nightfall",
              customerName: "User NAKI",
              customerContact: "user@example.com",
              projectType: "Website",
              budgetRange: "Rp1.000.000",
              message: "Pesanan uji",
              orderType: "custom_project",
              status: "quotation",
              paymentStatus: "waiting_payment",
              paymentMethod: "Midtrans",
              paymentReference: "NAKI-17",
              paymentUrl: "https://example.com/pay",
              paymentAmount: 300_000,
              subtotalAmount: 1_000_000,
              discountAmount: 0,
              gatewayFeeAmount: 0,
              netAmount: 1_000_000,
              currency: "IDR",
              quoteAmount: 1_000_000,
              quoteNotes: "Penawaran uji",
              quoteSentAt: "2026-09-14T08:00:00.000Z",
              quoteStatus: "pending",
              quoteRespondedAt: null,
              depositPercent: 30,
              amountPaid: 0,
              paymentStage: "deposit",
              remainingAmount: 1_000_000,
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
              templatePrice: "Rp1.000.000",
              templateLynkUrl: null,
              deliveryStatus: "locked",
              sourceCodeItems: [],
              setupGuide: null,
              demoUrl: null,
              createdAt: "2026-09-14T07:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 6,
          total: 1,
          totalPages: 1,
        };
      }

      return { notifications: [] };
    }),
    apiPost: vi.fn(),
  };
});

describe("MyOrdersPage", () => {
  it("marks every secondary order action with its dark-mode surface", async () => {
    renderWithProviders(<MyOrdersPage onTemplateUpdate={vi.fn()} />, {
      auth: { token: "user-token", username: "naki-user", role: "user" },
      route: "/pesanan-saya",
    });

    await screen.findByRole("heading", { name: "Naki Nightfall" });

    expect(screen.getByRole("button", { name: /refresh/i })).toHaveClass(
      "naki-orders-secondary-action",
    );
    expect(screen.getByRole("button", { name: /belum lunas/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(screen.getByRole("button", { name: /dibatalkan/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(screen.getByRole("button", { name: /review/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(screen.getByRole("button", { name: /pengerjaan/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(
      screen.queryByRole("button", { name: /sudah dibayar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pelunasan/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(screen.getByRole("button", { name: /selesai/i })).toHaveClass(
      "naki-orders-filter-action",
    );
    expect(screen.getByRole("button", { name: /^semua$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("navigation", { name: /filter progres pesanan/i }),
    ).toHaveTextContent("Semua: Seluruh progres pesanan.");
    expect(screen.getByRole("button", { name: /^tolak$/i })).toHaveClass(
      "naki-orders-danger-action",
    );
    expect(
      screen.getByRole("link", { name: /buka halaman bayar/i }),
    ).toHaveClass("naki-orders-secondary-action");
    expect(screen.getByRole("link", { name: /lihat checkout/i })).toHaveClass(
      "naki-orders-secondary-action",
    );
    expect(screen.getByText("Jenis transaksi").parentElement).toHaveClass(
      "naki-orders-detail-surface",
    );
    expect(screen.getByText("Penawaran harga").closest("section")).toHaveClass(
      "naki-orders-detail-surface",
    );
    expect(screen.getByText("Ref: NAKI-17").parentElement).toHaveClass(
      "naki-orders-detail-inset",
    );
    const quotePanel = screen.getByText("Penawaran harga").closest("section");
    const paymentPanel = screen
      .getByText("Pembayaran")
      .closest(".naki-orders-detail-surface");

    expect(quotePanel?.parentElement).toBe(paymentPanel?.parentElement);
    expect(quotePanel?.parentElement).toHaveClass(
      "naki-orders-commerce-grid",
      "xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]",
    );
    expect(
      screen.queryByText("Rating akan terbuka setelah pembayaran berhasil."),
    ).not.toBeInTheDocument();
  });
});
