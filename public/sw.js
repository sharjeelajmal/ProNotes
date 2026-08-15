const CACHE_NAME = 'pronotes-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: NEVER intercept non-GET requests (POST, PUT, DELETE, etc.)
  // Let the browser handle POST, Server Actions, Form submissions natively!
  if (event.request.method !== 'GET') {
    return;
  }

  // Never intercept API routes, Server Actions, or Next.js internals
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    event.request.headers.get('next-action')
  ) {
    return;
  }

  // Handle navigation requests with fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }
});
