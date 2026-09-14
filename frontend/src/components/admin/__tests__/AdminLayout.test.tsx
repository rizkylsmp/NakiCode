import { fireEvent, screen } from "@testing-library/react";
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
  it("uses a compact mobile menu and keeps desktop offset breakpoint-only", () => {
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

    const mobileMenu = screen.getByRole("combobox", { name: "Menu admin" });
    const sidebar = container.querySelector("aside");
    const main = container.querySelector("main");

    expect(mobileMenu).toHaveValue("orders");
    expect(sidebar).toHaveClass("hidden", "lg:flex");
    expect(main).toHaveClass("min-w-0", "lg:ml-56");

    fireEvent.change(mobileMenu, { target: { value: "portfolio" } });
    expect(onNavigate).toHaveBeenCalledWith("portfolio");
  });
});
