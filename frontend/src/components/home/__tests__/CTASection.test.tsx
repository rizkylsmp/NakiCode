import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CTASection } from "../CTASection";

describe("CTASection", () => {
  it("keeps the mobile actions before the illustration and touch friendly", () => {
    const { container } = render(<CTASection />);
    const primaryAction = screen.getByRole("link", {
      name: /jelajahi design/i,
    });
    const consultationAction = screen.getByRole("link", {
      name: /konsultasi gratis/i,
    });
    const illustration = screen.getByRole("img", {
      name: /Honne mengajak konsultasi/i,
    });

    expect(primaryAction).toHaveClass("h-11", "sm:h-12");
    expect(consultationAction).toHaveClass("h-11", "sm:h-12");
    expect(
      primaryAction.compareDocumentPosition(illustration) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(illustration.parentElement).not.toHaveClass("order-first");
    expect(container.firstElementChild).toBeInTheDocument();
  });
});
