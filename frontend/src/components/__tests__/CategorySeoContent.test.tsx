import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategorySeoContent } from "../catalog/CategorySeoContent";
import categorySeoItems from "../../domain/category-seo.json";

describe("CategorySeoContent contact", () => {
  it("uses the shared NAKI CODE contact with the category message", () => {
    render(<CategorySeoContent category={categorySeoItems[0].slug} />);
    const url = new URL(
      screen
        .getByRole("link", { name: /konsultasikan kebutuhan/i })
        .getAttribute("href")!,
    );
    expect(url.pathname).toBe("/6285159734244");
    expect(url.searchParams.get("text")).toContain(categorySeoItems[0].name);
  });
});
