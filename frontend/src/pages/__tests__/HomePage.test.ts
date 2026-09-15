import { describe, expect, it } from "vitest";
import type { TemplateItem } from "../../domain/content";
import { calculateStorefrontAverageRating } from "../HomePage";

function makeDesign(
  rating: number,
  ratingCount?: number,
): TemplateItem {
  return { rating, ratingCount } as unknown as TemplateItem;
}

describe("calculateStorefrontAverageRating", () => {
  it("does not count unrated designs as zero-star reviews", () => {
    expect(
      calculateStorefrontAverageRating([makeDesign(5, 1), makeDesign(0, 0)]),
    ).toBe(5);
  });

  it("weights design averages by their actual rating counts", () => {
    expect(
      calculateStorefrontAverageRating([makeDesign(5, 3), makeDesign(3, 1)]),
    ).toBe(4.5);
  });
});
