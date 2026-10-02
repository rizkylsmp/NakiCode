import { afterEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  resolveInitialTheme,
  readThemePreference,
  resolveTheme,
  themeStorageKey,
} from "../theme";

describe("theme", () => {
  it("keeps system preference distinct from resolved light or dark mode", () => {
    window.localStorage.setItem(themeStorageKey, "system");
    expect(readThemePreference()).toBe("system");
    expect(resolveTheme("system")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("system");
  });
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
