import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PortfolioGrid } from "../PortfolioSection";
import { renderWithProviders } from "../../../test/render";
import type { PortfolioItem } from "../../../domain/content";

const portfolioItems: PortfolioItem[] = [
  {
    id: 11,
    title: "Astra Studio",
    category: "Company Profile",
    description: "Company profile modern dengan galeri visual.",
    result: "Launch selesai",
    imageUrl: "https://example.com/astra-cover.jpg",
    imageUrls: [
      "https://example.com/astra-cover.jpg",
      "https://example.com/astra-1.jpg",
      "https://example.com/astra-2.jpg",
    ],
    coverIndex: 0,
  },
];

describe("PortfolioGrid", () => {
  it("opens a masonry preview modal when clicking preview", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PortfolioGrid items={portfolioItems} />, {
      route: "/portofolio",
    });

    await user.click(
      screen.getByRole("button", { name: /preview astra studio/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /preview portofolio astra studio/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gallery preview")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("dialog", { name: /preview portofolio astra studio/i }),
      ).getAllByRole("img", { name: /astra studio capture/i }),
    ).toHaveLength(3);
    expect(screen.getByRole("button", { name: /^view astra studio$/i })).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: /buka full screen astra studio capture 1/i,
      }),
    );

    expect(
      screen.getByRole("dialog", { name: /full screen preview/i }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("dialog", { name: /full screen preview/i }),
      ).getByRole("img", { name: /astra studio capture 1/i }),
    ).toBeInTheDocument();
  });
});
