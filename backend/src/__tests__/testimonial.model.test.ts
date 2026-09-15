import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("../db", () => ({ pool: { query } }));

describe("testimonial model", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("fills public testimonial slots with ratings that have no message", async () => {
    query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([
        [
          {
            id: 7,
            customer_name: "Sychlew",
            rating: 5,
            message: null,
            design_id: 12,
            design_title: "Naki Nightfall",
            created_at: "2026-09-15T00:00:00.000Z",
          },
        ],
      ]);

    const { findFeaturedTestimonials } = await import(
      "../models/testimonial.model"
    );
    const testimonials = await findFeaturedTestimonials();

    expect(testimonials).toEqual([
      expect.objectContaining({
        id: -7,
        rating_id: 7,
        quote: "",
        rating: 5,
        design_title: "Naki Nightfall",
      }),
    ]);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining("WHERE NOT EXISTS"),
      [10],
    );
  });
});
