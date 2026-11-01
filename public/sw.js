// Service Worker for Saad Furniture PWA & Mobile Web Push Notifications
const CACHE_NAME = 'saad-furniture-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Real-time Push Notification handler (Delivers when app is in background or closed)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Saad Furniture Atelier',
    message: 'Your craftsmanship progress has been updated.',
    body: 'Your craftsmanship progress has been updated.',
    url: '/',
    icon: '/assets/branding/app-dp.png',
    badge: '/assets/branding/notification-icon.svg',
    tag: 'order-update',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      if (parsed.message && !parsed.body) {
        data.body = parsed.message;
      }
    } catch {
      data.body = event.data.text();
      data.message = data.body;
    }
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/assets/branding/app-dp.png',
    badge: data.badge || '/assets/branding/notification-icon.svg',
    vibrate: [200, 100, 200, 100, 250],
    tag: data.tag || 'saad-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open_order',
        title: 'View Details 🛋️',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click event handler when user taps notification in mobile tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
