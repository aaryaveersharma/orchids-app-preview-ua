// Firebase Messaging Service Worker
// Required by Firebase JS SDK for background push message handling

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Receive Firebase config from the main app and initialize
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !self._firebaseInitialized) {
    try {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();

      // Handle background messages (app closed / backgrounded)
      messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title || 'Urban Auto';
        const body = payload.notification?.body || '';
        const icon = payload.notification?.icon || '/icon-192.png';
        const url = payload.data?.url || 'https://urbanauto.in';

        self.registration.showNotification(title, {
          body,
          icon,
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
          data: { url },
        });
      });

      self._firebaseInitialized = true;
      console.log('[FCM SW] Initialized for project:', event.data.config.projectId);
    } catch (e) {
      console.error('[FCM SW] Init error:', e);
    }
  }
});

// Fallback push handler (used when Firebase SDK is not initialized yet)
self.addEventListener('push', (event) => {
  if (self._firebaseInitialized) return;

  let title = 'Urban Auto';
  let body = 'You have a new update.';
  let icon = '/icon-192.png';
  let url = 'https://urbanauto.in';

  try {
    if (event.data) {
      const payload = event.data.json();
      title = payload.notification?.title || payload.title || title;
      body = payload.notification?.body || payload.body || body;
      icon = payload.notification?.icon || icon;
      url = payload.data?.url || payload.fcmOptions?.link || url;
    }
  } catch {
    if (event.data) body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url },
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
