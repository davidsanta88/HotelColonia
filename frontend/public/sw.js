const CACHE_NAME = 'hotel-app-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (e.request.url.includes('/api/')) return;
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

// Push notification handler
self.addEventListener('push', (e) => {
    let data = { title: 'Hotel System', body: 'Nueva notificación', icon: '/logo.jpg' };
    try { data = { ...data, ...e.data.json() }; } catch (_) {}
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/logo.jpg',
            badge: '/logo.jpg',
            vibrate: [200, 100, 200],
            data: data.url || '/',
            actions: [{ action: 'open', title: 'Abrir' }]
        })
    );
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(wcs => {
            if (wcs.length > 0) { wcs[0].focus(); wcs[0].navigate(e.notification.data); }
            else clients.openWindow(e.notification.data || '/');
        })
    );
});
