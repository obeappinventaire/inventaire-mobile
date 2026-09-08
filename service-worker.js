const CACHE_NAME = 'inventaire-cache-v8';

const CORE_ASSETS = [
  './',
  './index.html',
  './monitoring.html',
  './manifest.json',
  './app_icon_co2h2o.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les requêtes vers Google Script
  if (request.method !== 'GET' || url.hostname.includes('script.google.com')) {
    return;
  }

  // Stratégie pour la navigation HTML (Network-first avec fallback adapté par page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((res) => {
            if (res) return res;
            if (request.url.includes('monitoring.html')) {
              return caches.match('./monitoring.html');
            }
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Stratégie Cache-First pour les assets statiques et CDN
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Mise en cache des réponses valides (y compris CORS ou opaque pour CDNs)
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // NE PAS renvoyer index.html pour les images, CSS ou scripts JS
          return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
        });
    })
  );
});
