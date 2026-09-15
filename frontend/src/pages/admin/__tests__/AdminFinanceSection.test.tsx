import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminFinanceSection } from "../AdminFinanceSection";

let categoriesShouldFail = false;
const apiGet = vi.fn(async (url: string) => {
  if (url === "/api/finance/categories") {
    if (categoriesShouldFail) throw new Error("category unavailable");
    return { categories: [] };
  }
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
const apiPost = vi.fn(async (_url: string) => ({
  synced: 1,
  message: "1 transaksi pembayaran dipulihkan.",
}));

vi.mock("../../../services/api-client", () => ({
  default: { get: vi.fn() },
  apiDelete: vi.fn(),
  apiGet: (url: string) => apiGet(url),
  apiPost: (url: string) => apiPost(url),
  apiPut: vi.fn(),
  getApiErrorMessage: vi.fn((_error, fallback: string) => fallback),
}));

describe("AdminFinanceSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    categoriesShouldFail = false;
  });

  it("shows an operational cash summary and exposes dropdown-based filters", async () => {
    render(<AdminFinanceSection />);

    await waitFor(() =>
      expect(screen.getByText(/5\.500\.000/)).toBeInTheDocument(),
    );
    expect(screen.queryByText("Arus kas")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ringkasan kas" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/bukan laporan akuntansi atau pajak/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Periode ringkasan keuangan")).toHaveValue(
      "this_month",
    );
    expect(screen.getByLabelText("Jenis transaksi keuangan")).toHaveValue(
      "all",
    );
    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toHaveTextContent("Halaman 1 dari 1");

    fireEvent.change(screen.getByLabelText("Periode ringkasan keuangan"), {
      target: { value: "custom" },
    });

    expect(screen.getByLabelText("Dari tanggal")).toBeInTheDocument();
    expect(screen.getByLabelText("Sampai tanggal")).toBeInTheDocument();
  });

  it("reconciles payment records only when the admin requests it", async () => {
    const user = userEvent.setup();
    render(<AdminFinanceSection />);

    const button = await screen.findByRole("button", {
      name: "Periksa pembayaran",
    });
    expect(apiPost).not.toHaveBeenCalled();

    await user.click(button);

    expect(apiPost).toHaveBeenCalledWith("/api/finance/reconcile");
    expect(
      await screen.findByText("1 transaksi pembayaran dipulihkan."),
    ).toBeInTheDocument();
  });

  it("keeps transactions usable when expense categories fail", async () => {
    categoriesShouldFail = true;
    render(<AdminFinanceSection />);

    expect(await screen.findByText(/8\.000\.000/)).toBeInTheDocument();
    expect(
      await screen.findByText(/kategori pengeluaran gagal dimuat/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/gagal memuat transaksi keuangan/i)).not.toBeInTheDocument();
  });
});
