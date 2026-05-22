const CACHE_NAME = "omniorder-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/icon.png",
  "/favicon.ico"
];

// Install Event - Pre-cache essential shells
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Intercept navigate and assets requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass database/API requests (Supabase) and non-GET requests
  if (url.hostname.includes("supabase.co") || event.request.method !== "GET") {
    return;
  }

  // Handle SPA routing navigation mode (return cached /index.html if offline)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cached index.html shell with the latest response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", clone));
          return response;
        })
        .catch(() => {
          // Serve cached single page shell if user is offline
          return caches.match("/index.html");
        })
    );
    return;
  }

  // Stale-While-Revalidate pattern for local assets, images, and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors during background revalidation
        });

      return cachedResponse || fetchPromise;
    })
  );
});
