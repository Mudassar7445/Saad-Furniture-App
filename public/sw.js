// Service Worker for Saad Furniture PWA & Mobile Web Push Notifications
const CACHE_NAME = 'saad-furniture-pwa-v8';

// Core asset cache for instant 0ms offline experience
const STATIC_ASSETS = [
  '/',
  '/manifest.json?v=5',
  '/assets/branding/app-dp.png?v=5',
  '/assets/branding/app-dp.svg?v=5',
  '/assets/branding/icon-192x192.png?v=5',
  '/assets/branding/icon-512x512.png?v=5',
  '/assets/branding/apple-touch-icon.png?v=5',
  '/assets/branding/notification-icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Mandatory Fetch event handler for Chrome / Android PWA Installability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API routes and chrome extension requests from caching
  if (url.pathname.startsWith('/api/') || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Network-first with cache fallback strategy for real-time dynamic content
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone response and cache static brand assets
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to root for navigations
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Real-time Push Notification handler (Delivers when app is in background or closed)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Saad Furniture Atelier',
    message: 'Your craftsmanship progress has been updated.',
    body: 'Your craftsmanship progress has been updated.',
    url: '/',
    icon: '/assets/branding/app-dp.png?v=5',
    badge: '/assets/branding/notification-icon.svg',
    tag: 'order-update',
    orderId: undefined,
    tab: undefined,
    filter: undefined,
    type: 'order_update',
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

  // Ensure target URL is present
  const targetUrl = data.url || (data.orderId ? `/orders/${data.orderId}${data.tab ? `?tab=${data.tab}` : ''}` : '/');

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/assets/branding/app-dp.png?v=5',
    badge: data.badge || '/assets/branding/notification-icon.svg',
    image: data.image || undefined,
    vibrate: [200, 100, 200, 100, 250],
    tag: data.tag || `saad-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    data: {
      url: targetUrl,
      orderId: data.orderId || data.relatedId,
      tab: data.tab || data.targetTab,
      filter: data.filter || data.targetFilter,
      type: data.type || data.targetType,
      title: data.title,
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open_url',
        title: 'Open View 🛋️',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click event handler when user taps notification in mobile tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  // Construct absolute URL
  const destination = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      // Check if an existing open window is on the same origin
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          // Focus the existing window
          await client.focus();

          // Post structured deep link message for instant in-app tab/filter navigation
          client.postMessage({
            type: 'DEEP_LINK_NAVIGATE',
            url: targetUrl,
            orderId: notifData.orderId,
            tab: notifData.tab,
            filter: notifData.filter,
            notificationType: notifData.type,
          });

          // Navigate window to exact deep link URL if needed
          if ('navigate' in client && client.url !== destination) {
            await client.navigate(destination);
          }
          return;
        }
      }

      // If no window is currently open, open target URL in standalone PWA window
      if (self.clients.openWindow) {
        return self.clients.openWindow(destination);
      }
    })
  );
});
