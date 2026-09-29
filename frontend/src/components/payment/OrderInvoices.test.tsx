import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../services/api-client", () => ({
  apiGet: mocks.get,
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
  default: { get: vi.fn() },
}));
import { OrderInvoices } from "./OrderInvoices";
describe("OrderInvoices", () => {
  beforeEach(() => vi.resetAllMocks());
  it("loads only when opened and distinguishes DP from balance", async () => {
    mocks.get.mockResolvedValue({
      invoices: [
        {
          id: 1,
          stage: "deposit",
          label: "Down Payment (DP)",
          invoiceNumber: "INV/DP",
          totalAmount: 2500000,
          currency: "IDR",
          status: "paid",
        },
        {
          id: 2,
          stage: "balance",
          label: "Pelunasan",
          invoiceNumber: "INV/BAL",
          totalAmount: 2500000,
          currency: "IDR",
          status: "issued",
        },
      ],
    });
    render(<OrderInvoices orderId={1} version="paid" />);
    expect(mocks.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Invoice" }));
    await waitFor(() =>
      expect(screen.getByText("Down Payment (DP)")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Unduh DP" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unduh pelunasan" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lunas/)).toBeInTheDocument();
    expect(screen.getByText(/Belum dibayar/)).toBeInTheDocument();
  });
  it("shows an empty state before invoicing", async () => {
    mocks.get.mockResolvedValue({ invoices: [] });
    render(<OrderInvoices orderId={1} version="new" />);
    fireEvent.click(screen.getByRole("button", { name: "Invoice" }));
    expect(
      await screen.findByText(/Invoice terbit setelah/),
    ).toBeInTheDocument();
  });
  it("allows retry after an error", async () => {
    mocks.get
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce({ invoices: [] });
    render(<OrderInvoices orderId={1} version="new" />);
    fireEvent.click(screen.getByRole("button", { name: "Invoice" }));
    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }));
    expect(
      await screen.findByText(/Invoice terbit setelah/),
    ).toBeInTheDocument();
  });
});
