import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { LanguageProvider } from "../../i18n/language";
import { Header } from "../layout/Header";
import { renderWithProviders } from "../../test/render";
import { couponBannerReopenEvent } from "../promotions/coupon-banner-events";

vi.mock("../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../services/api-client")
  >("../../services/api-client");

  return {
    ...actual,
    apiGet: vi.fn(async (path: string) => {
      if (path === "/api/designs") return { templates: [] };
      if (path === "/api/business/coupons/banners") {
        return {
          banners: [
            {
              id: 1,
              code: "NAKI10",
              description: "Promo",
              discountType: "percent",
              discountValue: 10,
              imageUrl: "/promo.webp",
            },
          ],
        };
      }
      return { notifications: [] };
    }),
    apiPatch: vi.fn(async () => ({ notifications: [] })),
  };
});

// Helper to render with router
const renderHeader = (auth?: {
  token: string;
  username: string;
  role: "user" | "admin";
}) => {
  return renderWithProviders(<Header />, { auth, route: "/" });
};

describe("Header Component", () => {
  it("follows system theme changes and closes Preferences when clicking outside", () => {
    let systemDark = false;
    let listener: (() => void) | undefined;
    const removeEventListener = vi.fn();
    const media = {
      get matches() {
        return systemDark;
      },
      addEventListener: vi.fn((_event: string, callback: () => void) => {
        listener = callback;
      }),
      removeEventListener,
    } as unknown as MediaQueryList;
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue(media);
    const { unmount } = renderHeader();
    systemDark = true;
    listener?.();
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Preferensi" }));
    fireEvent.pointerDown(document.body);
    expect(
      screen.queryByRole("dialog", { name: "Preferensi tampilan" }),
    ).not.toBeInTheDocument();
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", listener);
    window.matchMedia = originalMatchMedia;
  });

  it("groups language and theme behind Preferences for guests and restores trigger focus", () => {
    renderWithProviders(
      <LanguageProvider>
        <Header />
      </LanguageProvider>,
    );
    expect(
      screen.queryByRole("group", { name: "Bahasa" }),
    ).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Preferensi" });
    fireEvent.click(trigger);
    const panel = screen.getByRole("dialog", { name: "Preferensi tampilan" });
    expect(
      within(panel).getByRole("button", { name: "Bahasa Indonesia" }),
    ).toHaveFocus();
    fireEvent.click(within(panel).getByRole("button", { name: "Gelap" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("naki-theme")).toBe("dark");
    fireEvent.click(within(panel).getByRole("button", { name: "Sistem" }));
    expect(localStorage.getItem("naki-theme")).toBe("system");
    fireEvent.click(within(panel).getByRole("button", { name: "English" }));
    expect(
      screen.getByRole("dialog", { name: "Appearance preferences" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Appearance preferences" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("places Coupon immediately to the right of notifications on desktop and mobile", async () => {
    renderHeader({ token: "fake-token", username: "testuser", role: "user" });
    const coupon = (
      await screen.findAllByRole("button", { name: "Tampilkan promo coupon" })
    )[0];
    expect(
      screen.getByRole("button", { name: "Buka notifikasi" }).parentElement
        ?.nextElementSibling,
    ).toBe(coupon);
    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    const mobileCoupon = screen.getAllByRole("button", {
      name: "Tampilkan promo coupon",
    })[1];
    expect(
      screen.getAllByRole("button", { name: "Buka notifikasi" })[1]
        .parentElement?.nextElementSibling,
    ).toBe(mobileCoupon);
    expect(screen.getByRole("region", { name: "Preferensi" })).toContainElement(
      screen.getByRole("group", { name: "Bahasa" }),
    );
  });

  it("renders the Naki Code logo", () => {
    renderHeader();

    const logo = screen.getByRole("link", { name: /NakiCode home/i });
    expect(logo).toBeInTheDocument();
    expect(logo.querySelector("img")).toHaveClass("size-10");
    expect(logo.querySelector("img")).not.toHaveClass("max-w-[120px]");
  });

  it("shows login link when user is not authenticated", () => {
    renderHeader();

    const loginLink = screen.getByRole("link", { name: /Login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveClass(
      "h-10",
      "border",
      "border-naki-steel",
      "bg-white",
      "px-3",
    );
  });

  it("shows user menu when authenticated as user", () => {
    renderHeader({
      token: "fake-token",
      username: "testuser",
      role: "user",
    });

    const username = screen.getByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });

  it("shows admin links when authenticated as admin", () => {
    renderHeader({
      token: "fake-admin-token",
      username: "admin",
      role: "admin",
    });

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByRole("button", { name: /admin/i })).toHaveClass(
      "h-10",
      "border",
      "border-naki-steel",
      "bg-white",
      "px-3",
    );

    expect(
      screen.getByRole("menuitem", { name: /dashboard admin/i }),
    ).toHaveAttribute("href", "/admin/dashboard");
    expect(
      screen.queryByRole("menuitem", { name: /kelola design/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /order masuk/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /portofolio/i }),
    ).not.toBeInTheDocument();
  });

  it("shows only Dashboard admin in the mobile admin account menu", () => {
    renderHeader({
      token: "fake-admin-token",
      username: "admin",
      role: "admin",
    });

    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));

    expect(
      screen.getByRole("menuitem", { name: "Dashboard admin" }),
    ).toHaveAttribute("href", "/admin/dashboard");
    expect(screen.queryByText("Kelola design")).not.toBeInTheDocument();
    expect(screen.queryByText("Order masuk")).not.toBeInTheDocument();
  });

  it("matches the regular user links in the mobile account menu", () => {
    renderHeader({
      token: "fake-user-token",
      username: "user",
      role: "user",
    });

    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));

    expect(
      screen.getByRole("menuitem", { name: "Profil saya" }),
    ).toHaveAttribute("href", "/akun-saya");
    expect(
      screen.getByRole("menuitem", { name: "Pesanan saya" }),
    ).toHaveAttribute("href", "/pesanan-saya");
    expect(screen.getByRole("menuitem", { name: "Wishlist" })).toHaveAttribute(
      "href",
      "/wishlist",
    );
  });

  it("renders navigation links", () => {
    renderHeader();

    // Check for main navigation links
    const homeLink = screen.getByRole("link", { name: /NakiCode home/i });
    expect(homeLink).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portofolio" })).toHaveAttribute(
      "href",
      "/portofolio",
    );
    expect(
      screen.queryByRole("link", { name: /^Jelajahi$/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the design search dialog", () => {
    renderHeader();

    const searchButtons = screen.getAllByRole("button", {
      name: /cari design/i,
    });
    expect(searchButtons).toHaveLength(2);
    searchButtons.forEach((button) => {
      expect(button).not.toHaveClass("border", "bg-white", "bg-naki-frost");
    });

    fireEvent.click(searchButtons[0]);

    expect(
      screen.getByRole("dialog", { name: /cari design/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/company profile/i)).toHaveFocus();
  });

  it("dispatches a request to reopen the coupon banner from the prize button", async () => {
    const onReopen = vi.fn();
    window.addEventListener(couponBannerReopenEvent, onReopen);
    renderHeader();

    const prizeButtons = await screen.findAllByRole("button", {
      name: /tampilkan promo coupon/i,
    });
    fireEvent.click(prizeButtons[0]);

    expect(onReopen).toHaveBeenCalledOnce();
    window.removeEventListener(couponBannerReopenEvent, onReopen);
  });
});
