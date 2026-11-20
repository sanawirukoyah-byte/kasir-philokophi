/* Kasir — Philokophi Street: service worker */
const CACHE = 'kasir-v7';

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
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
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
  if (url.origin !== self.location.origin) return; // biarkan font eksternal lewat

  // Navigasi & Berkas Aplikasi (HTML, JS, CSS, JSON): Network-First
  // Selalu coba ambil versi terbaru dari jaringan agar perubahan menu langsung tampil seketika.
  // Jika offline / jaringan gagal, otomatis fallback ke cache lokal.
  const path = url.pathname;
  const isAppFile = req.mode === 'navigate' ||
                    path.endsWith('.html') ||
                    path.endsWith('.js') ||
                    path.endsWith('.css') ||
                    path.endsWith('.json');

  if (isAppFile) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(req, { ignoreSearch: true }).then(r => {
            if (r) return r;
            if (req.mode === 'navigate') return caches.match('./index.html');
            return Response.error();
          });
        })
    );
    return;
  }

  // Aset statis lainnya (gambar, ikon): Cache-First, fallback jaringan
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
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
