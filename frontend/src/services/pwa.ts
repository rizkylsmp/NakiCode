export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    void setupServiceWorkerUpdates();
  });
}

async function setupServiceWorkerUpdates() {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let hasReloaded = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || hasReloaded) return;

    hasReloaded = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });

    activateWaitingWorker(registration);
    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (
          installingWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          installingWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    await registration.update();
    activateWaitingWorker(registration);

    const checkForUpdates = () => {
      if (document.visibilityState !== "visible") return;

      void registration.update();
      void reloadWhenFrontendBuildChanges();
    };

    window.addEventListener("focus", checkForUpdates);
    document.addEventListener("visibilitychange", checkForUpdates);
  } catch {
    // PWA updates should never block the website from loading.
  }
}

function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

async function reloadWhenFrontendBuildChanges() {
  const currentEntry = getFrontendEntry(document.documentElement.innerHTML);
  if (!currentEntry) return;

  try {
    const response = await fetch("/", {
      cache: "no-store",
      headers: { "X-Naki-Version-Check": "1" },
    });
    if (!response.ok) return;

    const latestEntry = getFrontendEntry(await response.text());
    if (
      latestEntry &&
      latestEntry !== currentEntry &&
      !isSensitiveUpdatePath(window.location.pathname)
    ) {
      window.location.reload();
    }
  } catch {
    // Stay on the current build while offline or when the version check fails.
  }
}

function isSensitiveUpdatePath(pathname: string) {
  return [
    "/admin",
    "/checkout",
    "/pesanan-saya",
    "/akun-saya",
    "/profile",
    "/login",
    "/forgot-password",
    "/verify-email",
  ].some((prefix) => pathname.startsWith(prefix));
}

export function getFrontendEntry(html: string) {
  const moduleScript = (html.match(/<script\b[^>]*>/gi) ?? []).find((tag) =>
    /\btype=["']module["']/i.test(tag),
  );
  const entryMatch = moduleScript?.match(/\bsrc=["']([^"']+)["']/i);

  return entryMatch?.[1] ?? "";
}
