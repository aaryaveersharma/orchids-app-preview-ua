// Firebase Messaging Service Worker
// Required by Firebase JS SDK for background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config is injected at runtime via __FIREBASE_CONFIG__ message
// or falls back to reading from the service worker's own URL search params.
// The messaging SDK handles the push event and shows notifications automatically.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (config && !self._firebaseInitialized) {
      try {
        firebase.initializeApp(config);
        firebase.messaging();
        self._firebaseInitialized = true;
        console.log('[FCM SW] Firebase initialized with project:', config.projectId);
      } catch (e) {
        console.error('[FCM SW] Init error:', e);
      }
    }
  }
});

// Handle background push messages (when app is closed/in background)
// The Firebase messaging SDK will handle this automatically once initialized.
// But we also keep a manual handler as fallback:
self.addEventListener('push', (event) => {
  // If Firebase SDK is handling it, this won't run for FCM messages.
  // This fallback handles any non-FCM web push messages.
  if (self._firebaseInitialized) return;

  let data = {
    title: 'Urban Auto Update',
    body: 'Check your booking status.',
    icon: '/icon-192.png',
    url: '/bookings'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        url: payload.data?.url || payload.fcmOptions?.link || payload.url || data.url,
      };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://urbanauto.in';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
