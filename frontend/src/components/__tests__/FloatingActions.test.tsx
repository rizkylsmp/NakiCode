import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FloatingActions } from "../layout/FloatingActions";
import { renderWithProviders } from "../../test/render";

describe("FloatingActions", () => {
  it("shows the WhatsApp shortcut on public pages", () => {
    renderWithProviders(<FloatingActions />, { route: "/design" });

    const whatsappLink = screen.getByRole("link", {
      name: /hubungi naki code melalui whatsapp/i,
    });
    expect(whatsappLink).toBeInTheDocument();
    expect(whatsappLink.querySelector("img")).toHaveAttribute(
      "src",
      "/images/brand/whatsapp.png",
    );
    expect(whatsappLink.querySelector("img")).toHaveClass(
      "brightness-0",
      "invert",
    );
  });

  it("hides the WhatsApp shortcut on admin pages", () => {
    renderWithProviders(<FloatingActions />, { route: "/admin/dashboard" });

    expect(
      screen.queryByRole("link", {
        name: /hubungi naki code melalui whatsapp/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /kembali ke atas/i }),
    ).toBeInTheDocument();
  });
});
