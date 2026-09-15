import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "../Hero";

describe("Hero", () => {
  it("centers the CTA group and lowers the character responsively", () => {
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
    expect(exploreLink.parentElement).toHaveClass("sm:justify-center");

    expect(
      screen.getByAltText(/karakter naki code sebagai visual hero/i),
    ).toHaveClass(
      "bottom-[-2.5rem]",
      "sm:bottom-[-3rem]",
      "md:-bottom-14",
      "lg:-bottom-16",
    );
  });
});
