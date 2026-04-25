const CACHE_NAME = 'stadi-v3'; // bumped: fixes navigation fetch handler
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass through: non-GET, non-http, and all API calls — never cache these
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  if (url.pathname.startsWith('/api/')) return;

  // FIX 1: Navigation requests (HTML page loads e.g. /teach, /courses, /instructor)
  // must always fall back to /index.html so the React SPA can handle routing.
  // Without this, a network failure on a page load returns an error instead of
  // the app shell — causing the "Failed to fetch" error on the /teach route.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // FIX 2: Static assets (JS chunks, CSS, images) — cache-first with network fallback.
  // The original code had an unhandled rejection when networkFetch failed and there
  // was no cached version (e.g. a new JS chunk after a deploy). Now we catch that
  // and return a safe undefined rather than letting the promise reject uncaught.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Only cache valid same-origin responses — never cache opaque responses
          // from CDNs (status 0) as we cannot inspect them for errors
          if (response.ok && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // FIX 2: on network error, fall back to cache silently

      return cached || networkFetch;
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Stadi', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new update from Stadi.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    image: data.image || undefined,
    data: data.data || { url: '/' },
    actions: data.actions || [
      { action: 'view', title: 'View Course' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: `stadi-course-${data.data?.courseId || Date.now()}`,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Stadi', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/courses';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    let publicKey;
    try {
      const res = await fetch('/api/push/vapid-public-key');
      const body = await res.json();
      publicKey = body?.data?.publicKey;
      if (!publicKey) return;
    } catch {
      return;
    }

    const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const applicationServerKey = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));

    const newSubscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: newSubscription }),
    });
  })());
});
