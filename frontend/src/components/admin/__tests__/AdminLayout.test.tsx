import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { AdminLayout } from "../AdminLayout";

vi.mock("../../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../../services/api-client")
  >("../../../services/api-client");

  return {
    ...actual,
    apiGet: vi.fn(async () => ({ notifications: [], banners: [] })),
    apiPatch: vi.fn(async () => ({ notifications: [] })),
  };
});

describe("AdminLayout responsive navigation", () => {
  it("uses an accessible mobile drawer and keeps desktop offset breakpoint-only", () => {
    const onNavigate = vi.fn();
    const { container } = renderWithProviders(
      <AdminLayout
        activeView="orders"
        adminUsername="admin"
        onLogout={vi.fn()}
        onNavigate={onNavigate}
      >
        <p>Konten admin</p>
      </AdminLayout>,
      {
        auth: { token: "admin-token", username: "admin", role: "admin" },
        route: "/admin/orders",
      },
    );

    const mobileMenu = screen.getByRole("button", {
      name: "Buka menu admin",
    });
    const sidebar = container.querySelector("aside");
    const main = container.querySelector("main");

    expect(mobileMenu).toHaveAttribute("aria-expanded", "false");
    expect(mobileMenu).toHaveTextContent("Orders");
    expect(sidebar).toHaveClass("hidden", "lg:flex");
    expect(main).toHaveClass("min-w-0", "lg:ml-56");

    fireEvent.click(mobileMenu);

    const drawer = screen.getByRole("dialog", {
      name: "Navigasi admin mobile",
    });
    expect(mobileMenu).toHaveAttribute("aria-expanded", "true");
    expect(
      within(drawer).getByRole("button", { name: "Orders" }),
    ).toHaveAttribute("aria-current", "page");

    fireEvent.click(within(drawer).getByRole("button", { name: "Portfolio" }));
    expect(onNavigate).toHaveBeenCalledWith("portfolio");
    expect(
      screen.queryByRole("dialog", { name: "Navigasi admin mobile" }),
    ).not.toBeInTheDocument();
  });

  it("closes the mobile drawer with Escape", () => {
    renderWithProviders(
      <AdminLayout
        activeView="dashboard"
        adminUsername="admin"
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
      >
        <p>Konten admin</p>
      </AdminLayout>,
      {
        auth: { token: "admin-token", username: "admin", role: "admin" },
        route: "/admin/dashboard",
      },
    );

    const mobileMenu = screen.getByRole("button", {
      name: "Buka menu admin",
    });
    fireEvent.click(mobileMenu);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "Navigasi admin mobile" }),
    ).not.toBeInTheDocument();
    expect(mobileMenu).toHaveFocus();
  });
});
