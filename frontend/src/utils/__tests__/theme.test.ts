import { afterEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  resolveInitialTheme,
  themeStorageKey,
} from "../theme";

describe("theme", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("menerapkan dark mode tersimpan sebelum halaman dimuat", () => {
    window.localStorage.setItem(themeStorageKey, "dark");

    const theme = resolveInitialTheme();
    applyTheme(theme, false);

    expect(theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
