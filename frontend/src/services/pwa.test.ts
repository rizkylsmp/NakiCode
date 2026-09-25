import { describe, expect, it } from "vitest";
import { getFrontendEntry } from "./pwa";

describe("getFrontendEntry", () => {
  it("membaca entry bundle Vite untuk membandingkan versi deployment", () => {
    expect(
      getFrontendEntry(
        '<script type="module" crossorigin src="/assets/index-current.js"></script>',
      ),
    ).toBe("/assets/index-current.js");
  });

  it("tetap membaca entry ketika urutan atribut script berubah", () => {
    expect(
      getFrontendEntry(
        '<script src="/assets/index-latest.js" data-build="new" type="module"></script>',
      ),
    ).toBe("/assets/index-latest.js");
  });

  it("mengabaikan script biasa dan markup yang tidak memiliki entry module", () => {
    expect(getFrontendEntry('<script src="/legacy.js"></script>')).toBe("");
  });
});
