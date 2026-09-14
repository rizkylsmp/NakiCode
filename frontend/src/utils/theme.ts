export type NakiTheme = "light" | "dark";

export const themeStorageKey = "naki-theme";

export function resolveInitialTheme(): NakiTheme {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: NakiTheme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) window.localStorage.setItem(themeStorageKey, theme);
}
