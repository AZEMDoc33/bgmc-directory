const CACHE_NAME = 'bgmc-directory-v7';
const FILES_TO_CACHE = ['./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(FILES_TO_CACHE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

// NETWORK-FIRST for pages: always try the live site, fall back to cache when offline.
// (Previous version was cache-first, which froze installed apps on stale content.)
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' ||
                 (e.request.destination === 'document') ||
                 e.request.url.endsWith('/index.html') || e.request.url.endsWith('/');
  if (isPage) {
    e.respondWith(
      fetch(e.request).then(function(r) {
        if (r && r.status === 200) {
          var copy = r.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, copy); });
        }
        return r;
      }).catch(function(){ return caches.match(e.request).then(function(m){ return m || caches.match('./index.html'); }); })
    );
  } else {
    // cache-first for static assets (icons, manifest, fonts)
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(r) {
          if (r && r.status === 200) {
            var copy = r.clone();
            caches.open(CACHE_NAME).then(function(c){ c.put(e.request, copy); });
          }
          return r;
        });
      })
    );
  }
});
