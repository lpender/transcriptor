// Everything, audio included, is cached on first visit so the app works on a train.
// Bump CACHE to publish a new version; the old one is deleted on activate.
const CACHE = 'transcriptor-4';
const CORE = ['.', 'index.html', 'sentences.js', 'script.js', 'clips.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.window = self;  // clips.js assigns to window; in a worker that is this scope
importScripts('clips.js');
const CLIPS = [...new Set(Object.values(self.CLIPS).map(c => (typeof c === 'string' ? c : c.f)))];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    // Clips are ~8MB; a failed one must not fail the install, it is fetched later.
    await Promise.all(CLIPS.map(c => cache.add(c).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Cache first: offline is the point, and a new version arrives with a new CACHE.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
    return res;
  })());
});
