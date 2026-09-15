import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { apiGet } from "../../../services/api-client";
import { TestimonialSection } from "../TestimonialSection";

vi.mock("../../../services/api-client", () => ({
  apiGet: vi.fn(),
}));

describe("TestimonialSection", () => {
  it("shows a buyer rating even when no testimonial message was provided", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      testimonials: [
        {
          id: -7,
          customer_name: "Sychlew",
          customer_role: null,
          quote: "",
          rating: 5,
          design_title: "Naki Nightfall",
        },
      ],
    });

    render(<TestimonialSection />);

    expect(await screen.findByText("5.0/5")).toBeInTheDocument();
    expect(screen.getByText("Naki Nightfall")).toBeInTheDocument();
    expect(screen.getByText("Sychlew")).toBeInTheDocument();
    expect(screen.queryByText('""')).not.toBeInTheDocument();
  });
});
