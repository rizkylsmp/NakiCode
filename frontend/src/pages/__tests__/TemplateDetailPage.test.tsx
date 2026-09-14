import { fireEvent, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { TemplateItem } from "../../domain/content";
import { renderWithProviders } from "../../test/render";
import { TemplateDetailPage } from "../TemplateDetailPage";

const design: TemplateItem = {
  id: 7,
  slug: "studio-preview",
  title: "Studio Preview",
  category: "Portfolio",
  description: "Design portfolio dengan galeri gambar dan video.",
  price: "Rp149K",
  stack: ["React"],
  level: "Pemula",
  rating: 0,
  accentClass: "bg-naki-secondary",
  preview: [
    { image: "https://example.com/cover.webp", caption: "Cover utama" },
  ],
  videoUrl: "https://example.com/preview.mp4",
  demoUrl: "#",
  sourceAvailable: false,
  buyerCount: 0,
  features: [],
  includedFiles: [],
  sourceCode: [],
  suitableFor: [],
  license: "Personal",
  support: "Setup dasar",
  reviews: [],
};

describe("TemplateDetailPage", () => {
  it("menampilkan video di galeri preview dan membuka detail dari paling atas", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    renderWithProviders(
      <HelmetProvider>
        <Routes>
          <Route
            path="/design/:slug"
            element={<TemplateDetailPage templates={[design]} />}
          />
        </Routes>
      </HelmetProvider>,
      { route: `/design/${design.slug}` },
    );

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const previewVideo = screen.getByLabelText(
      `Video preview ${design.title}`,
    );

    expect(previewVideo).toHaveAttribute("src", design.videoUrl);
    expect(previewVideo).toHaveProperty("autoplay", true);
    expect(previewVideo).toHaveProperty("muted", true);
    expect(
      screen.getByRole("button", { name: "Tampilkan video preview 1" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Tampilkan gambar preview 2" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Tampilkan gambar preview 2" }),
    );

    expect(
      screen
        .getByRole("button", { name: "Buka preview layar penuh" })
        .querySelector("img"),
    ).toHaveAttribute("src", design.preview[0].image);
  });
});
