const CACHE_NAME = 'urban-auto-v2';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/urban-auto-logo.jpg',
  '/screenshot-1.jpg',
  '/screenshot-wide.jpg',
  '/screenshot-2.jpg',
  '/screenshot-3.jpg',
  '/screenshot-4.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background Sync for Offline Bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'urban-auto-booking-sync') {
    event.waitUntil(replayQueuedBookings());
  }
});

// Periodic Sync for Updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'urban-auto-periodic-sync') {
    event.waitUntil(refreshAppData());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'Urban Auto Update', 
    body: 'Check your booking status.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/bookings'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      // FCM Legacy/V1 formats vary. Handle common structures.
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        url: payload.data?.url || payload.url || data.url
      };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
    // Fallback if data is not JSON (e.g. plain text)
    if (event.data) {
        data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon,
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Helper functions
async function replayQueuedBookings() {
  // Logic to read from IndexedDB and retry POST requests
  console.log('Replaying queued bookings...');
}

async function refreshAppData() {
  // Logic to fetch latest services and offers in background
  console.log('Refreshing app data...');
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(['/services', '/home']);
}
