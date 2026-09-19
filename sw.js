// Everything, audio included, is cached on first visit so the app works on a train.
// Bump CACHE to publish a new version; the old one is deleted on activate.
const CACHE = 'transcriptor-14';
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

// Audio never changes once rendered, so it comes from the cache. The page and its
// data are fetched first when online: serving a stale script.js beside a fresh
// clips.js leaves every line without a clip, and a reload cannot clear it.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const audio = e.request.url.endsWith('.mp3');
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (audio) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
    }
    try {
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (offline) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw offline;
    }
  })());
});
