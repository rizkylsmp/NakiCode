export const SITE_NAME = "Naki Code";
export const DEFAULT_SITE_ORIGIN = "https://nakicode.com";

export function getSiteOrigin() {
  const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim();

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {
      // Fall through to the deployed origin or the canonical production domain.
    }
  }

  if (
    typeof window !== "undefined" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return window.location.origin;
  }

  return DEFAULT_SITE_ORIGIN;
}

export function absoluteSiteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, `${getSiteOrigin()}/`).toString();
}

