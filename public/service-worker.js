// Minimal service worker — just enough for "installable PWA" (a registered
// SW + manifest is one of the browser's install criteria) plus some app-shell
// resilience on flaky connections. All real data comes from the Apps Script
// backend over the network; this deliberately doesn't try to be a full
// offline-data cache.

const CACHE_NAME = "momken-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for same-origin GETs, falling back to the last cached copy
// when offline (e.g. the app shell loads even with no signal; task data
// itself still needs a real connection to the backend).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
