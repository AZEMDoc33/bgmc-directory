// BGMC Directory Service Worker
// Cache version — bump this number whenever you update the directory data
const CACHE_NAME = 'bgmc-directory-v1';

// All files to cache for offline use
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// ─── Install: cache all files ────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Take over immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// ─── Fetch: cache-first strategy (works offline) ─────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache — works offline
        return cachedResponse;
      }

      // Not in cache — try network, then cache the response for next time
      return fetch(event.request).then(networkResponse => {
        // Only cache valid GET responses
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type === 'opaque' ||
          event.request.method !== 'GET'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Network failed and nothing in cache — return offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
