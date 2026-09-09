import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechStackBadge } from "../TechStackBadge";

describe("TechStackBadge", () => {
  it("shows a technology icon instead of a hash prefix", () => {
    const { container } = render(<TechStackBadge tech="React" />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("#React");
  });

  it("keeps unknown stack names with a fallback icon", () => {
    const { container } = render(<TechStackBadge tech="Custom Engine" variant="pill" />);

    expect(screen.getByText("Custom Engine")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
