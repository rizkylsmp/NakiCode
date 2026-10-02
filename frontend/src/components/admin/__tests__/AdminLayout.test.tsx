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
  it("collapses to accessible icons, widens content, and remembers the preference", () => {
    const onNavigate = vi.fn();
    const onLogout = vi.fn();
    const layout = (key: string) => (
      <AdminLayout
        key={key}
        activeView="orders"
        adminUsername="admin"
        onLogout={onLogout}
        onNavigate={onNavigate}
      >
        <p>Konten admin</p>
      </AdminLayout>
    );
    const { container, rerender } = renderWithProviders(layout("first"), {
      auth: { token: "admin-token", username: "admin", role: "admin" },
      route: "/admin/orders",
    });
    fireEvent.click(screen.getByRole("button", { name: "Ciutkan sidebar" }));
    const sidebar = screen.getByRole("complementary", {
      name: "Navigasi admin",
    });
    expect(sidebar).toHaveClass("w-20");
    expect(container.querySelector("main")).toHaveClass("lg:ml-20");
    expect(container.querySelector("main")).not.toHaveClass(
      "lg:ml-56",
      "xl:ml-60",
    );
    expect(
      screen.getByRole("button", { name: "Perluas sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
    const orders = within(sidebar).getByRole("button", { name: "Orders" });
    expect(orders).toHaveAttribute("title", "Orders");
    expect(orders).toHaveAttribute("aria-current", "page");
    expect(orders).not.toHaveTextContent("Orders");
    fireEvent.click(within(sidebar).getByRole("button", { name: "Portfolio" }));
    expect(onNavigate).toHaveBeenCalledWith("portfolio");
    fireEvent.click(
      within(sidebar).getByRole("button", { name: "Logout admin" }),
    );
    expect(onLogout).toHaveBeenCalledOnce();
    expect(localStorage.getItem("naki-admin-sidebar-collapsed")).toBe("true");

    rerender(layout("remounted"));
    expect(
      screen.getByRole("button", { name: "Perluas sidebar" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Buka menu admin" }));
    const drawer = screen.getByRole("dialog", {
      name: "Navigasi admin mobile",
    });
    expect(
      within(drawer).getByRole("button", { name: "Orders" }),
    ).toHaveTextContent("Orders");
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Perluas sidebar" }));
    expect(container.querySelector("main")).toHaveClass("lg:ml-56", "xl:ml-60");
    expect(
      within(
        screen.getByRole("complementary", { name: "Navigasi admin" }),
      ).getByRole("button", { name: "Orders" }),
    ).toHaveTextContent("Orders");
    expect(localStorage.getItem("naki-admin-sidebar-collapsed")).toBe("false");
  });

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
