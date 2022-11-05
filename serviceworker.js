self.addEventListener('install', (e) => {
});
self.addEventListener('activate', (e) => {
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
