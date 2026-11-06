const CACHE_NAME = 'granfish-cache-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'catalogo-embarcacoes.html',
  'catalogo-admin.html',
  'catalogo.html',
  'cadastro.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'logo GF.png',
  'css/style.css',
  'css/cadastro.css',
  'css/catalogo.css',
  'css/admin.css',
  'css/chatbot.css',
  'js/chatbot.js',
  'js/catalogo-dados.js',
  'js/catalogo-admin.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
