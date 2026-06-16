// Naki Code Service Worker - Enhanced Caching
// Version: 1.0.0

const CACHE_VERSION = 'v1';
const CACHE_SHELL = `naki-shell-${CACHE_VERSION}`;
const CACHE_API = `naki-api-${CACHE_VERSION}`;
const CACHE_IMAGES = `naki-images-${CACHE_VERSION}`;
const CACHE_NAMES = [CACHE_SHELL, CACHE_API, CACHE_IMAGES];

// App shell resources to cache on install
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/logo.png',
  '/offline.html'
];

// API endpoints to cache (for offline access)
const CACHEABLE_API_PATTERNS = [
  /\/api\/templates$/,
  /\/api\/categories$/,
  /\/api\/projects$/
];

// Install event - cache app shell and offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CACHE_NAMES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event - route-based caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip authentication and mutation endpoints
  if (url.pathname.startsWith('/api/auth') || 
      url.pathname.startsWith('/api/orders') ||
      url.pathname.startsWith('/api/payments')) {
    return;
  }

  // Strategy 1: API responses - Network-first with cache fallback
  if (isCacheableAPI(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, CACHE_API));
    return;
  }

  // Strategy 2: Images - Stale-while-revalidate
  if (request.destination === 'image' || isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // Strategy 3: App shell - Cache-first with network fallback
  event.respondWith(cacheFirstStrategy(request, CACHE_SHELL));
});

// Network-first strategy: Try network, fallback to cache
// Best for: API responses that should be fresh but work offline
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
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
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, but we might have cache
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // No cache, wait for network
  return networkPromise;
}

// Cache-first strategy: Return cache if available, otherwise fetch
// Best for: App shell resources that rarely change
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Helper: Check if pathname matches cacheable API patterns
function isCacheableAPI(pathname) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(pathname));
}

// Helper: Check if request is for an image
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}
