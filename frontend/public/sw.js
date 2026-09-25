// Naki Code Service Worker - update-safe caching
// Version: 2.0.0

const CACHE_VERSION = "v2";
const CACHE_SHELL = `naki-shell-${CACHE_VERSION}`;
const CACHE_API = `naki-api-${CACHE_VERSION}`;
const CACHE_IMAGES = `naki-images-${CACHE_VERSION}`;
const CACHE_NAMES = [CACHE_SHELL, CACHE_API, CACHE_IMAGES];

// Keep only truly stable offline resources in the install cache. HTML pages are
// fetched from the network first so a previous deployment cannot pin old UI.
const APP_SHELL = ["/manifest.webmanifest", "/logo.png", "/offline.html"];

// API endpoints to cache (for offline access)
const CACHEABLE_API_PATTERNS = [
  /\/api\/designs$/,
  /\/api\/categories$/,
  /\/api\/projects$/,
  /\/api\/blog$/,
];

// Install event - cache app shell and offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(activateServiceWorker());
});

async function activateServiceWorker() {
  const cacheKeys = await caches.keys();
  const oldNakiCaches = cacheKeys.filter(
    (key) => key.startsWith("naki-") && !CACHE_NAMES.includes(key),
  );

  await Promise.all(oldNakiCaches.map((key) => caches.delete(key)));
  await self.clients.claim();

  // The previous v1 worker served navigations cache-first. Refresh only public
  // pages once during migration; transactional/admin screens keep their state.
  if (oldNakiCaches.length > 0) {
    const windowClients = await self.clients.matchAll({ type: "window" });

    await Promise.all(
      windowClients.map((client) => {
        const clientUrl = new URL(client.url);
        const isSensitivePage = [
          "/admin",
          "/checkout",
          "/pesanan-saya",
          "/akun-saya",
          "/profile",
          "/login",
          "/forgot-password",
          "/verify-email",
        ].some((prefix) => clientUrl.pathname.startsWith(prefix));

        return isSensitivePage
          ? Promise.resolve()
          : client.navigate(client.url).catch(() => undefined);
      }),
    );
  }
}

// Fetch event - route-based caching strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and non-web requests.
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Skip authentication and mutation endpoints
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/orders") ||
    url.pathname.startsWith("/api/payments")
  ) {
    return;
  }

  // Never cache streamed media or private downloadable files.
  if (
    request.headers.has("range") ||
    request.destination === "audio" ||
    request.destination === "video" ||
    (url.pathname.startsWith("/uploads/") && request.destination !== "image")
  ) {
    return;
  }

  // Navigations must prefer the network so a returning visitor immediately
  // receives the latest deployed HTML. Cached pages remain an offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // API responses - network-first with cache fallback.
  if (isCacheableAPI(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, CACHE_API));
    return;
  }

  // Same-origin images may be replaced while keeping their URL, so fetch them
  // from the network first. Third-party images can use stale-while-revalidate.
  if (request.destination === "image" || isImageRequest(url)) {
    event.respondWith(
      url.origin === self.location.origin
        ? networkFirstStrategy(request, CACHE_IMAGES)
        : staleWhileRevalidate(request, CACHE_IMAGES),
    );
    return;
  }

  // Vite assets contain a content hash and are safe to cache permanently.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_SHELL));
    return;
  }

  // Other same-origin resources prefer the latest network response.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstStrategy(request, CACHE_SHELL));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_SHELL);

  try {
    const networkResponse = await fetch(request, { cache: "no-cache" });

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return (
      (await cache.match(request)) || (await caches.match("/offline.html"))
    );
  }
}

// Network-first strategy: Try network, fallback to cache
// Best for: API responses that should be fresh but work offline
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request, { cache: "no-cache" });

    // Cache successful responses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available, return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }

    throw error;
  }
}

// Stale-while-revalidate strategy: Return cache immediately, update in background
// Best for: Images and assets that can be stale but should update eventually
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const networkPromise = fetch(request).then(async (response) => {
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // No cache, wait for network
  return networkPromise.catch(() => {
    throw new Error("Network and image cache are unavailable");
  });
}

// Cache-first strategy: Return cache if available, otherwise fetch
// Best for: App shell resources that rarely change
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses (only HTTP/HTTPS, skip chrome-extension:// etc)
    if (networkResponse.ok && request.url.startsWith("http")) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }

    throw error;
  }
}

// Helper: Check if pathname matches cacheable API patterns
function isCacheableAPI(pathname) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(pathname));
}

// Helper: Check if request is for an image
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}
