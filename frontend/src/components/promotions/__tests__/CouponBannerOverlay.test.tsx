import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CouponBannerOverlay } from "../CouponBannerOverlay";
import { apiGet } from "../../../services/api-client";
import { couponBannerReopenEvent } from "../coupon-banner-events";

vi.mock("../../../services/api-client", () => ({ apiGet: vi.fn() }));

const banners = [
  {
    id: 1,
    code: "NAKI10",
    description: "Promo pertama",
    discountType: "percent",
    discountValue: 10,
    imageUrl: "https://cdn.example.com/one.webp",
  },
  {
    id: 2,
    code: "NAKI20",
    description: "Promo kedua",
    discountType: "fixed",
    discountValue: 20_000,
    imageUrl: "https://cdn.example.com/two.webp",
  },
] as const;

function renderBanner(route = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <CouponBannerOverlay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CouponBannerOverlay", () => {
  it("shows active coupon banners as a slider", async () => {
    vi.mocked(apiGet).mockResolvedValue({ banners });
    renderBanner();

    expect(
      await screen.findByRole("dialog", { name: /promo coupon naki code/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Promo pertama" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /banner berikutnya/i }));
    expect(
      screen.getByRole("heading", { name: "Promo kedua" }),
    ).toBeInTheDocument();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "naki-coupon-banners-seen-v1",
      "1:https://cdn.example.com/one.webp|2:https://cdn.example.com/two.webp",
    );
  });

  it("does not show the same banner set on the next opening", async () => {
    window.localStorage.setItem(
      "naki-coupon-banners-seen-v1",
      "1:https://cdn.example.com/one.webp|2:https://cdn.example.com/two.webp",
    );
    vi.mocked(apiGet).mockResolvedValue({ banners });
    renderBanner();

    await waitFor(() => expect(apiGet).toHaveBeenCalled());
    expect(
      screen.queryByRole("dialog", { name: /promo coupon naki code/i }),
    ).not.toBeInTheDocument();
  });

  it("does not request or show public banners in admin", () => {
    vi.mocked(apiGet).mockResolvedValue({ banners });
    renderBanner("/admin/coupons");

    expect(apiGet).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reopens a previously closed banner when the prize event is dispatched", async () => {
    window.localStorage.setItem(
      "naki-coupon-banners-seen-v1",
      "1:https://cdn.example.com/one.webp|2:https://cdn.example.com/two.webp",
    );
    vi.mocked(apiGet).mockResolvedValue({ banners });
    renderBanner();

    await waitFor(() => expect(apiGet).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() => {
      fireEvent(window, new Event(couponBannerReopenEvent));
      expect(
        screen.getByRole("dialog", { name: /promo coupon naki code/i }),
      ).toBeInTheDocument();
    });
  });
});
