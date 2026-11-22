const CACHE_NAME = 'pocketcoach-offline-v4';
const APP_FILES = ['./index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_FILES.map(url => cache.add(url)));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_error) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) ||
               (await cache.match(event.request)) ||
               new Response('PocketCoach could not load offline.', { status: 503 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_error) {
      return cache.match(event.request);
    }
  })());
});
