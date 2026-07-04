type AnalyticsProvider = "ga4" | "plausible" | "umami" | "none";

const analyticsProvider = String(
  import.meta.env.VITE_ANALYTICS_PROVIDER ?? "none",
) as AnalyticsProvider;
const gaMeasurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? "");
const plausibleDomain = String(import.meta.env.VITE_PLAUSIBLE_DOMAIN ?? "");
const umamiWebsiteId = String(import.meta.env.VITE_UMAMI_WEBSITE_ID ?? "");

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: Record<string, unknown>) => void;
    umami?: { track: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

export function initializeAnalytics() {
  if (analyticsProvider === "ga4" && gaMeasurementId) {
    injectScript(
      `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`,
      true,
    );
    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
      window.gtag ??
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    window.gtag("js", new Date());
    window.gtag("config", gaMeasurementId);
  }

  if (analyticsProvider === "plausible" && plausibleDomain) {
    const script = injectScript("https://plausible.io/js/script.js", true);
    script.setAttribute("data-domain", plausibleDomain);
  }

  if (analyticsProvider === "umami" && umamiWebsiteId) {
    const script = injectScript("https://cloud.umami.is/script.js", true);
    script.setAttribute("data-website-id", umamiWebsiteId);
  }
}

export function trackPageView(path: string) {
  if (analyticsProvider === "ga4" && window.gtag && gaMeasurementId) {
    window.gtag("config", gaMeasurementId, { page_path: path });
  }
}

export function trackEvent(eventName: string, props?: Record<string, unknown>) {
  if (analyticsProvider === "ga4" && window.gtag) {
    window.gtag("event", eventName, props ?? {});
  }

  if (analyticsProvider === "plausible" && window.plausible) {
    window.plausible(eventName, { props });
  }

  if (analyticsProvider === "umami" && window.umami) {
    window.umami.track(eventName, props);
  }
}

function injectScript(src: string, async = false) {
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`,
  );

  if (existingScript) {
    return existingScript;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = async;
  script.defer = true;
  document.head.appendChild(script);

  return script;
}
