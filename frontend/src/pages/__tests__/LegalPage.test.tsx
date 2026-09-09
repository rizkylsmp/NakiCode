import { screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { LegalPage } from "../LegalPage";

describe("LegalPage", () => {
  it("renders the privacy policy and footer legal links", () => {
    renderWithProviders(
      <HelmetProvider>
        <LegalPage kind="privacy" />
      </HelmetProvider>,
      { route: "/kebijakan-privasi" },
    );

    expect(screen.getByRole("heading", { level: 1, name: "Kebijakan Privasi" })).toBeInTheDocument();
    expect(screen.getByText(/Undang-Undang Nomor 27 Tahun 2022/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Syarat & Ketentuan" })).toHaveAttribute("href", "/syarat-ketentuan");
  });

  it("renders the terms and conditions", () => {
    renderWithProviders(
      <HelmetProvider>
        <LegalPage kind="terms" />
      </HelmetProvider>,
      { route: "/syarat-ketentuan" },
    );

    expect(screen.getByRole("heading", { level: 1, name: "Syarat & Ketentuan" })).toBeInTheDocument();
    expect(screen.getByText(/hukum Republik Indonesia/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kebijakan Privasi" })).toHaveAttribute("href", "/kebijakan-privasi");
  });
});
