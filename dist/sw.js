const CACHE_NAME = 'escape-from-zog-v-c4d379d';
const urlsToCache = ["./Orbitron-ExtraBold.ttf","./apple-icon-180.png","./bgs.png","./doodles.xcf","./favicon.ico","./game.js","./index.html","./logo.png","./models","./music","./t.png"];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});