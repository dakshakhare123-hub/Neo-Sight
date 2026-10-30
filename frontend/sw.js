// NeoScan Service Worker — Clinical PWA App Shell
// Designed for lighting-robust smartphone neonatal screening
const CACHE_NAME = 'neoscan-pwa-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/app/app.js',
  '/app/icon-192.png',
  '/app/icon-512.png',
  '/app/favicon.svg',
  '/app/apple-touch-icon.png',
  '/app/logo-mark.svg',
  '/app/logo-horizontal.svg'
];

// Install: Cache critical app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use map to avoid failing entire install if an individual non-critical icon fails
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[NeoScan SW] Pre-caching ${url} skipped:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Prune stale caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatcher
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. NEVER cache clinical inference APIs or patient health endpoints
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            status: "error",
            error: "OFFLINE",
            message: "Network unavailable. NeoScan is operating offline. Screenings are saved locally."
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // 2. Navigation requests: App shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/') || caches.match('/app/index.html');
      })
    );
    return;
  }

  // 3. Static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Only cache successful GET responses from our own origin or CDN scripts
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          request.method === 'GET' &&
          (url.origin === self.location.origin || url.hostname.includes('cdn') || url.hostname.includes('unpkg'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn(`[NeoScan SW] Fetch failed for ${request.url}:`, err);
        return new Response('', { status: 408, statusText: 'Request timed out' });
      });
    })
  );
});
