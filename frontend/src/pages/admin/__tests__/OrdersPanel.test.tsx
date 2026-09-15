import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrderItem } from "../../../domain/order-types";
import { apiDelete } from "../../../services/api-client";
import { OrdersPanel } from "../OrdersPanel";

vi.mock("../../../services/api-client", () => ({
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiUpload: vi.fn(),
  getApiErrorMessage: vi.fn((_error, fallback: string) => fallback),
}));

const order = {
  id: 66,
  customerName: "Sychlew",
  customerContact: "sychlew@example.com",
  templateTitle: "NAKI Portfolio",
  projectType: "Website custom",
  budgetRange: "Rp2.000.000",
  message: "Buat website portfolio yang responsif.",
  orderType: "custom_project",
  status: "new",
  paymentStatus: "pending",
  paymentMethod: null,
  paymentAmount: null,
  amountPaid: 0,
  remainingAmount: 0,
  quoteAmount: null,
  quoteNotes: null,
  quoteStatus: null,
  depositPercent: 50,
  deliveryReviewStatus: null,
  deliverySourceUrl: null,
  deliveryDemoUrl: null,
  deliveryNotes: null,
  revisionNotes: null,
  revisionFiles: [],
  createdAt: "2026-09-15T08:00:00.000Z",
} as unknown as OrderItem;

describe("OrdersPanel order tools", () => {
  it("defaults to Ringkas, toggles filters, and provides working pagination", () => {
    const onOrdersPageChange = vi.fn();

    render(
      <OrdersPanel
        isLoadingOrders={false}
        onDeleteOrder={vi.fn()}
        onOrderFiltersChange={vi.fn()}
        onOrdersPageChange={onOrdersPageChange}
        onOrdersPageSizeChange={vi.fn()}
        onRefreshOrders={vi.fn()}
        onUpdateOrderStatus={vi.fn(async () => undefined)}
        orderFilters={{ status: "all", paymentStatus: "all", search: "" }}
        orders={[order]}
        ordersMeta={{ total: 20, totalPages: 2, pageSize: 10 }}
        ordersPage={1}
        ordersStatus=""
        updatingOrderId={null}
      />,
    );

    expect(screen.queryByText("Workspace penjualan")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /checkout|order baru/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("table", {
        name: "Daftar order dalam tampilan tabel ringkas",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("sychlew@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ringkas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan filter" }));
    expect(screen.getByRole("searchbox", { name: "Cari order" })).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Status order" }),
    ).toHaveDisplayValue("Semua");
    expect(
      screen.getByRole("combobox", { name: "Pembayaran" }),
    ).toHaveDisplayValue("Semua bayar");
    expect(screen.queryByText("Status order: Semua")).not.toBeInTheDocument();
    expect(screen.queryByText("Pembayaran: Semua")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan filter" }));
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(onOrdersPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Nyaman" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sychlew" })).toBeInTheDocument();
  });

  it("validates selected orders in a dialog before bulk deletion", async () => {
    const onRefreshOrders = vi.fn();
    vi.mocked(apiDelete).mockResolvedValue(undefined);
    const paidOrder = {
      ...order,
      id: 67,
      customerName: "Honne",
      paymentStatus: "paid",
    } as OrderItem;

    render(
      <OrdersPanel
        isLoadingOrders={false}
        onDeleteOrder={vi.fn()}
        onOrderFiltersChange={vi.fn()}
        onOrdersPageChange={vi.fn()}
        onOrdersPageSizeChange={vi.fn()}
        onRefreshOrders={onRefreshOrders}
        onUpdateOrderStatus={vi.fn(async () => undefined)}
        orderFilters={{ status: "all", paymentStatus: "all", search: "" }}
        orders={[order, paidOrder]}
        ordersMeta={{ total: 2, totalPages: 1, pageSize: 10 }}
        ordersPage={1}
        ordersStatus=""
        updatingOrderId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pilih halaman" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus order terpilih" }),
    );

    expect(apiDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Hapus 2 order terpilih?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 order dapat dihapus, 1 order bertransaksi/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hapus 1 order" }));

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith("/api/orders/66");
    });
    expect(apiDelete).toHaveBeenCalledTimes(1);
    expect(onRefreshOrders).toHaveBeenCalledTimes(1);
  });
});
