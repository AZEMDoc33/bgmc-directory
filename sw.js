const CACHE_NAME = 'bgmc-directory-v6';
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

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(r) {
        if (r && r.status===200 && e.request.method==='GET') {
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,r.clone());});
        }
        return r;
      });
    }).catch(function(){ return caches.match('./index.html'); })
  );
});
