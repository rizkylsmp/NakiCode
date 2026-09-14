import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/ui/Toast";
import { AdminCategoriesSection } from "../AdminCategoriesSection";

function renderSection() {
  render(
    <ToastProvider>
      <AdminCategoriesSection
        adminToken="admin-token"
        categories={[
          {
            id: 3,
            name: "Portfolio",
            designCount: 4,
            designTitles: [
              "Studio Arunika",
              "Visual Nusa",
              "Karya Legacy",
              "Ruang Cerita",
            ],
          },
          {
            id: 4,
            name: "Landing Page",
            designCount: 0,
            designTitles: [],
          },
        ]}
        onCategoriesChange={vi.fn()}
      />
    </ToastProvider>,
  );
}

describe("AdminCategoriesSection", () => {
  it("shows category usage and blocks deleting a category that is in use", () => {
    renderSection();

    expect(screen.getByText("4 Design")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("0 Design")).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Studio ArunikaVisual NusaKarya LegacyRuang Cerita",
    );
    expect(
      screen.getByRole("button", {
        name: "Tidak dapat menghapus Portfolio; masih dipakai oleh 4 design",
      }),
    ).toBeDisabled();
  });

  it("allows deleting an unused category", () => {
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Hapus kategori Landing Page" }),
    );

    expect(
      screen.getByRole("heading", { name: "Hapus Kategori?" }),
    ).toBeInTheDocument();
  });
});
