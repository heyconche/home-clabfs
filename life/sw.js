self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
    if (event.data?.type !== 'show-notification') {
        return;
    }
    const payload = event.data.payload || {};
    event.waitUntil(
        self.registration.showNotification(payload.title || 'life.conche.com.br', {
            body: payload.body || '',
            tag: payload.tag || `life-${Date.now()}`,
            badge: '/icon.svg',
            icon: '/icon.svg',
            data: payload.data || {},
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
            const existing = clientsList.find((client) => client.url.includes('life.conche.com.br'));
            if (existing) {
                return existing.focus();
            }
            return clients.openWindow ? clients.openWindow('/') : undefined;
        })
    );
});
