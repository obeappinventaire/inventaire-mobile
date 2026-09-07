const CACHE_NAME = 'inventaire-cache-v1';
const ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Les requêtes vers Google Sheets ne sont pas interceptées (gérées par la file locale)
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});