// QIROX Cafe Service Worker - Handles push notifications and offline caching

const CACHE_NAME = 'qirox-cafe-v3';

// Install: cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/logo.png', '/manifest.json']).catch(() => {});
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Push notification handler - this fires on Android and iOS PWA
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'QIROX Cafe', body: event.data ? event.data.text() : 'إشعار جديد' };
  }

  const title = data.title || 'QIROX Cafe';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'qirox-notification',
    requireInteraction: data.requireInteraction !== false,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/employee/orders',
      ...data,
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || '/employee/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(url);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync — auto-sync offline POS orders when connectivity returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-orders') {
    event.waitUntil(
      (async () => {
        try {
          const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open('qirox-offline-db', 1);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });

          const pending = await new Promise((resolve, reject) => {
            const tx = db.transaction('offline-orders', 'readonly');
            const idx = tx.objectStore('offline-orders').index('status');
            const req = idx.getAll('pending');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });

          for (const order of pending) {
            try {
              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order.orderData),
              });
              const newStatus = res.ok ? 'synced' : 'failed';
              const tx2 = db.transaction('offline-orders', 'readwrite');
              const store = tx2.objectStore('offline-orders');
              const record = await new Promise(r => { const req = store.get(order.localId); req.onsuccess = () => r(req.result); });
              if (record) { record.status = newStatus; store.put(record); }
            } catch {}
          }

          // Notify all open clients
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach(c => c.postMessage({ type: 'OFFLINE_SYNC_COMPLETE' }));
        } catch {}
      })()
    );
  }
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API requests (let them go to network)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }

  // For static assets: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For HTML pages: network-first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
