import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminFinanceSection } from "../AdminFinanceSection";

const apiGet = vi.fn(async (url: string) => {
  if (url === "/api/finance/categories") return { categories: [] };
  return {
    summary: {
      income: 8_000_000,
      expense: 2_000_000,
      refunds: 500_000,
      fees: 100_000,
      netProfit: 5_500_000,
    },
    transactions: [],
    page: 1,
    total: 0,
    totalPages: 1,
  };
});

vi.mock("../../../services/api-client", () => ({
  default: { get: vi.fn() },
  apiDelete: vi.fn(),
  apiGet: (url: string) => apiGet(url),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  getApiErrorMessage: vi.fn((_error, fallback: string) => fallback),
}));

describe("AdminFinanceSection", () => {
  it("shows profit statistics and exposes dropdown-based filters", async () => {
    render(<AdminFinanceSection />);

    await waitFor(() =>
      expect(screen.getByText(/5\.500\.000/)).toBeInTheDocument(),
    );
    expect(screen.queryByText("Arus kas")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Statistik laba/rugi" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Periode statistik pembukuan")).toHaveValue(
      "this_month",
    );
    expect(screen.getByLabelText("Jenis transaksi pembukuan")).toHaveValue(
      "all",
    );
    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toHaveTextContent("Halaman 1 dari 1");

    fireEvent.change(screen.getByLabelText("Periode statistik pembukuan"), {
      target: { value: "custom" },
    });

    expect(screen.getByLabelText("Dari tanggal")).toBeInTheDocument();
    expect(screen.getByLabelText("Sampai tanggal")).toBeInTheDocument();
  });
});
