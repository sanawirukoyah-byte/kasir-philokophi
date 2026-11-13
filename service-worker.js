/* Kasir — Philokophi Street: service worker */
const CACHE = 'kasir-v1';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/store.js',
  './js/ui.js',
  './js/kasir.js',
  './js/produk.js',
  './js/riwayat.js',
  './js/laporan.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // biarkan font eksternal lewat (fallback sistem saat offline)

  // Navigasi: coba jaringan dulu, fallback cache index
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then(r => r || Response.error()))
    );
    return;
  }

  // Aset: cache-first, fallback jaringan
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => Response.error());
    })
  );
});