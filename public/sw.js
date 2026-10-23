// Stellar Mart BD - High Performance Service Worker v4
const CACHE_VERSION = 'stellarmart-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

// Static core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/banners/default_banner_1.webp',
  '/banners/default_banner_2.webp',
  '/banners/default_banner_3.webp',
  '/banners/default_banner_4.webp',
  '/banners/default_banner_5.webp',
];

// Install: pre-cache critical shell assets & activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache non-fatal error:', err);
      });
    })
  );
});

// Activate: clean up older cache versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// Fetch routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or unsupported schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // ── 1. Next.js Immutable Static Chunks & CSS (Cache-First) ───────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached;
        }
      })
    );
    return;
  }

  // ── 2. Cross-Origin Requests (Let browser & external CDNs handle natively) ──
  // External CDNs (Cloudinary, Supabase, Google, Unsplash) have their own HTTP cache headers.
  // Intercepting them in SW causes opaque response errors, CORS issues, and net::ERR_FAILED.
  if (url.origin !== self.location.origin) {
    return;
  }

  // ── 3. Sensitive / User / Auth / Admin APIs (Network-Only — Never Cache) ───
  if (
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/cart') ||
    url.pathname.startsWith('/api/orders') ||
    url.pathname.startsWith('/api/checkout') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.startsWith('/api/vendor') ||
    url.pathname.startsWith('/api/user') ||
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // ── 4. Public Read APIs (Stale-While-Revalidate) ──────────────────────────
  if (
    url.pathname === '/api/categories' ||
    url.pathname === '/api/banners' ||
    url.pathname === '/api/home' ||
    url.pathname === '/api/flash-sale' ||
    url.pathname === '/api/settings'
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── 5. Same-Origin Images & Media (Stale-While-Revalidate) ────────────────
  const isImageRequest =
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/banners/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|avif|ico|gif)$/i);

  if (isImageRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        const response = await (cached || fetchPromise);
        return response || fetch(request);
      })
    );
    return;
  }

  // ── 6. HTML Navigation Requests (Network-First with Offline Fallback) ──────
  // Never abort navigation on arbitrary short timeouts so slow networks and throttled Lighthouse tests succeed.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const homeFallback = await caches.match('/');
          if (homeFallback) return homeFallback;
          return new Response('Offline - Please check your internet connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }
});
