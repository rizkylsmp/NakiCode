import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WHATSAPP_NUMBER,
  getWhatsAppUrl,
  normalizeWhatsAppNumber,
} from "../whatsapp";

afterEach(() => vi.unstubAllEnvs());

describe("WhatsApp contact", () => {
  it.each([
    "+6285159734244",
    "6285159734244",
    "085159734244",
    "+62 851-5973-4244",
  ])("normalizes %s for wa.me", (number) => {
    expect(normalizeWhatsAppNumber(number)).toBe("6285159734244");
  });

  it.each([undefined, "", "undefined", "123", "6285159734244?text=other"])(
    "uses the current contact when configuration is invalid: %s",
    (number) => {
      expect(normalizeWhatsAppNumber(number)).toBe(DEFAULT_WHATSAPP_NUMBER);
    },
  );

  it("uses the environment contact and encodes the message once", () => {
    vi.stubEnv("VITE_WHATSAPP_NUMBER", "+6285159734244");
    const message = "Halo, design A & B 50%?";
    const url = new URL(getWhatsAppUrl(message));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/6285159734244");
    expect(url.searchParams.get("text")).toBe(message);
  });

  it("allows changing all contact links through one environment setting", () => {
    vi.stubEnv("VITE_WHATSAPP_NUMBER", "+6280000000000");
    expect(new URL(getWhatsAppUrl("Halo")).pathname).toBe("/6280000000000");
  });
});
