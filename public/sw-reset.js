self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  self.clients.claim();
});
