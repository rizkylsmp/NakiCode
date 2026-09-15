import { describe, expect, it } from "vitest";
import { formatRupiahInputPreview } from "./currency";

describe("formatRupiahInputPreview", () => {
  it("formats a numeric input using the requested Indonesian display", () => {
    expect(formatRupiahInputPreview("2000000")).toBe("Rp. 2.000.000,-");
  });

  it("accepts an already punctuated value and keeps empty input empty", () => {
    expect(formatRupiahInputPreview("Rp 1.250.000")).toBe("Rp. 1.250.000,-");
    expect(formatRupiahInputPreview(50000)).toBe("Rp. 50.000,-");
    expect(formatRupiahInputPreview("")).toBe("");
  });
});
