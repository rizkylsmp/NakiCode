export type NakiTheme = "light" | "dark";
export type ThemePreference = NakiTheme | "system";

export const themeStorageKey = "naki-theme";

export function readThemePreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(themeStorageKey);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference): NakiTheme {
  return preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : preference;
}

export function resolveInitialTheme(): NakiTheme {
  return resolveTheme(readThemePreference());
}

export function applyTheme(theme: NakiTheme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      /* Storage is optional. */
    }
  }
}
