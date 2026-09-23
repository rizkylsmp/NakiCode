import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "../Hero";

describe("Hero", () => {
  it("centers mobile CTAs and aligns them left from md without changing the character", () => {
    render(
      <Hero
        averageRating={5}
        totalProjects={10}
        totalTemplates={20}
        totalTransactions={30}
      />,
    );

    const exploreLink = screen.getByRole("link", {
      name: /jelajahi design/i,
    });
    expect(exploreLink.parentElement).toHaveClass(
      "sm:justify-center",
      "md:justify-start",
    );

    expect(
      screen.getByAltText(/karakter naki code sebagai visual hero/i),
    ).toHaveClass(
      "bottom-[-1.75rem]",
      "sm:bottom-[-1.75rem]",
      "md:-bottom-10",
      "lg:-bottom-12",
    );
  });
});
