export function getDisplayLocale() {
  try {
    return localStorage.getItem("naki-language") === "en" ? "en-GB" : "id-ID";
  } catch {
    return "id-ID";
  }
}
