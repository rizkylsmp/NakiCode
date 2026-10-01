import { describe, expect, it } from "vitest";
import {
  formatRupiahInputPreview,
  formatRupiahText,
  parseRupiahAmount,
} from "./currency";

describe("formatRupiahInputPreview", () => {
  it("formats a numeric input using the requested Indonesian display", () => {
    expect(formatRupiahInputPreview("2000000")).toBe("Rp. 2.000.000,-");
    expect(formatRupiahInputPreview("5000000")).toBe("Rp. 5.000.000,-");
  });

  it("preserves zero and negative ledger balances", () => {
    expect(formatRupiahText(0)).toBe("Rp. 0,-");
    expect(formatRupiahText(-2000000)).toBe("Rp. -2.000.000,-");
    expect(formatRupiahText("Rp. -2.000.000,-")).toBe("Rp. -2.000.000,-");
  });

  it("parses legacy shorthand without inventing amounts from descriptive text", () => {
    expect(parseRupiahAmount("Rp1,5Jt")).toBe(1500000);
    expect(parseRupiahAmount("Rp. 5.000.000,-")).toBe(5000000);
    expect(parseRupiahAmount("Rp500K - Rp1Jt")).toBeNull();
    expect(parseRupiahAmount("abc500")).toBeNull();
    expect(formatRupiahText("Hubungi kami")).toBe("Hubungi kami");
  });

  it("accepts an already punctuated value and keeps empty input empty", () => {
    expect(formatRupiahInputPreview("Rp 1.250.000")).toBe("Rp. 1.250.000,-");
    expect(formatRupiahInputPreview(50000)).toBe("Rp. 50.000,-");
    expect(formatRupiahInputPreview("")).toBe("");
    expect(formatRupiahInputPreview("Rp149K")).toBe("Rp. 149.000,-");
  });
});
