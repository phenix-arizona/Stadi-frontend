// public/sw.js — Feature 4: Offline Lesson Downloads
// Registered in main.jsx on app boot

const CACHE_VERSION  = 'stadi-v1';
const MANIFEST_CACHE = 'stadi-manifests';
const VIDEO_CACHE    = 'stadi-videos';
const SYNC_TAG       = 'stadi-progress-sync';

// ── Install: pre-cache app shell ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(['/', '/index.html', '/offline.html'])
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== MANIFEST_CACHE && k !== VIDEO_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for manifests, network-first for API ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Offline manifests: cache-first with 3h revalidation
  if (url.pathname.includes('/offline-manifest')) {
    event.respondWith(cacheFirst(request, MANIFEST_CACHE, 3 * 60 * 60));
    return;
  }

  // Video chunks: cache-first (large files, long-lived)
  if (url.hostname.includes('cloudinary') || url.hostname.includes('res.cloudinary')) {
    event.respondWith(cacheFirst(request, VIDEO_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Progress API: network-first, queue on failure
  if (url.pathname.includes('/api/progress')) {
    event.respondWith(networkFirstWithQueue(request));
    return;
  }

  // Everything else: network-first, fall back to cache
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);

  if (cached) {
    const fetchedAt = cached.headers.get('sw-fetched-at');
    const age       = fetchedAt ? (Date.now() - parseInt(fetchedAt)) / 1000 : Infinity;
    if (age < maxAgeSeconds) return cached;
  }

  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const copy    = response.clone();
      const headers = new Headers(copy.headers);
      headers.set('sw-fetched-at', String(Date.now()));
      const body = await copy.blob();
      await cache.put(request, new Response(body, { status: copy.status, statusText: copy.statusText, headers }));
    }
    return response;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Queue failed progress saves for background sync
const offlineQueue = [];

async function networkFirstWithQueue(request) {
  try {
    return await fetch(request.clone());
  } catch {
    // Clone request body before it's consumed
    const body = await request.clone().json().catch(() => null);
    if (body) {
      offlineQueue.push({ url: request.url, method: request.method, body });
      // Register background sync if supported
      if (self.registration.sync) {
        await self.registration.sync.register(SYNC_TAG).catch(() => {});
      }
    }
    return new Response(JSON.stringify({ success: true, queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Background sync: flush queued progress ───────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const toRetry = [...offlineQueue];
  offlineQueue.length = 0;

  for (const item of toRetry) {
    try {
      const token = await getAuthToken();
      await fetch('/api/progress/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records: Array.isArray(item.body) ? item.body : [item.body] }),
      });
    } catch {
      offlineQueue.push(item); // re-queue if still offline
    }
  }
}

// Read token from localStorage (accessible in SW via client messaging)
async function getAuthToken() {
  const clients = await self.clients.matchAll({ type: 'window' });
  return new Promise((resolve) => {
    if (!clients.length) return resolve(null);
    const mc = new MessageChannel();
    mc.port1.onmessage = (e) => resolve(e.data?.token || null);
    clients[0].postMessage({ type: 'GET_TOKEN' }, [mc.port2]);
    setTimeout(() => resolve(null), 1000);
  });
}

// ── Message handler ───────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'FLUSH_QUEUE')  flushQueue();
  if (event.data?.type === 'CACHE_LESSON') cacheLessonManifest(event.data.courseId);
});

async function cacheLessonManifest(courseId) {
  if (!courseId) return;
  try {
    const token   = await getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res     = await fetch(`/api/courses/${courseId}/offline-manifest`, { headers });
    if (!res.ok) return;

    const manifest = await res.json();
    const cache    = await caches.open(VIDEO_CACHE);

    // Cache each video URL from manifest
    for (const lesson of (manifest?.data?.lessons || [])) {
      const videoUrl = lesson.videoUrl;
      if (!videoUrl) continue;
      try {
        const vRes = await fetch(videoUrl);
        if (vRes.ok) await cache.put(videoUrl, vRes);
      } catch { /* skip individual failures */ }
    }

    // Cache manifest itself
    const mCache = await caches.open(MANIFEST_CACHE);
    await mCache.put(`/api/courses/${courseId}/offline-manifest`, res.clone?.() || new Response(JSON.stringify(manifest)));
  } catch (err) {
    console.error('[SW] Cache lesson error:', err);
  }
}
