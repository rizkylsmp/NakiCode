import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminCouponsSection } from "../AdminCouponsSection";

vi.mock("../../../services/api-client", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(async () => ({
    coupons: [
      {
        id: 1,
        code: "NAKI10",
        description: "Diskon uji",
        discountType: "percent",
        discountValue: 10,
        active: true,
        expiresAt: "2027-01-01T00:00:00.000Z",
        maxRedemptions: null,
        imageUrl: null,
        showBanner: false,
        createdAt: "2026-09-15T00:00:00.000Z",
        redemptionCount: 0,
      },
    ],
  })),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  getApiErrorMessage: vi.fn((_error, fallback: string) => fallback),
}));

describe("AdminCouponsSection pagination", () => {
  it("keeps pagination visible when coupons only fill one page", async () => {
    render(<AdminCouponsSection adminToken="admin-token" />);

    await waitFor(() => expect(screen.getByText("NAKI10")).toBeInTheDocument());

    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toHaveTextContent("Halaman 1 dari 1");
  });
});
