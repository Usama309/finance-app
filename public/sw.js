/**
 * CashGuard Service Worker
 * Handles: offline caching, push notifications, scheduled reminders
 */

const CACHE_NAME = "cashguard-v1";
const ASSETS = ["/", "/manifest.json"];

// Install — cache shell
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "CashGuard";
  const options = {
    body: data.body || "Check your finances",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "cashguard-notification",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Click notification → open app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((cls) => {
      if (cls.length > 0) return cls[0].focus();
      return clients.openWindow(e.notification.data.url || "/");
    })
  );
});
