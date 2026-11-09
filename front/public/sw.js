// Minimal service worker: only needed to show notifications (Android Chrome requires it).
// No fetch handler, so nothing is ever cached.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const client = clients[0]
      return client ? client.focus() : self.clients.openWindow('/')
    })
  )
})
