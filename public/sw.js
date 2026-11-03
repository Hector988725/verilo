const CACHE_NAME = 'verilo-v2';
const OFFLINE_URLS = ['/', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy: always try the real network (for fresh listings/data),
// fall back to cache only when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache or intercept API calls or the owner/provider panels: they carry
  // private data (reports, dues, provider details) that must not sit in cache storage.
  const path = new URL(event.request.url).pathname;
  if (path.startsWith('/api/') || path.startsWith('/admin') || path.startsWith('/provider')) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});


// ---- Web Push (provider alerts) ----
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Verilo', {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag,
    icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: d.url || '/provider/dashboard' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        try { if ('navigate' in c && c.url !== url) await c.navigate(url); } catch (e) {}
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
