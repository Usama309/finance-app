/**
 * CashGuard Service Worker
 * Handles: offline caching, push notifications, scheduled daily reminders at 9 AM
 */

const CACHE_NAME = "cashguard-v2";
const ASSETS = ["/", "/manifest.json"];

// Install — cache shell
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches + schedule daily notification
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => scheduleDailyNotification())
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

// ── Daily 9 AM Notification System ──

/**
 * Schedule a daily notification at 9:00 AM local time.
 * Uses a periodic check approach since service workers can't use setInterval reliably.
 * The SW wakes up on messages from the main app to re-check timing.
 */
function scheduleDailyNotification() {
  checkAndNotify();
}

function checkAndNotify() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const todayKey = now.toISOString().split("T")[0];

  // Check if we already sent today's notification
  // We use a simple approach: store the last notification date
  const lastNotifKey = "cashguard_daily_notif";

  // Only fire between 9:00 and 9:15 AM
  if (hour === 9 && minute < 15) {
    // Read from cache to check if already sent
    caches.open("cashguard-meta").then(async (cache) => {
      const resp = await cache.match(lastNotifKey);
      const lastDate = resp ? await resp.text() : "";

      if (lastDate !== todayKey) {
        // Send the daily notification
        sendDailyBudgetNotification();
        // Mark as sent
        cache.put(lastNotifKey, new Response(todayKey));
      }
    }).catch(() => {
      // Fallback: just send it
      sendDailyBudgetNotification();
    });
  }
}

function sendDailyBudgetNotification() {
  // Try to get budget info from the main thread
  self.clients.matchAll({ type: "window" }).then((clients) => {
    if (clients.length > 0) {
      // Ask the main app for budget data
      clients[0].postMessage({ type: "GET_DAILY_BUDGET" });
    } else {
      // App not open — send generic reminder
      self.registration.showNotification("CashGuard - Daily Budget", {
        body: "Open CashGuard to check today's spending limit!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "daily-budget",
        data: { url: "/" },
        vibrate: [200, 100, 200],
        actions: [{ action: "open", title: "View Budget" }],
      });
    }
  });
}

// Listen for messages from main app
self.addEventListener("message", (e) => {
  if (e.data?.type === "DAILY_BUDGET_DATA") {
    const { dailyBudget, todaySpent, daysLeft } = e.data;
    const budgetStr = dailyBudget ? `Rs ${Math.round(dailyBudget).toLocaleString()}` : "Open app to check";

    let body = `Today's spending limit is ${budgetStr}`;
    if (todaySpent > 0) {
      body += ` | Already spent: Rs ${Math.round(todaySpent).toLocaleString()}`;
    }
    if (daysLeft) {
      body += ` | ${daysLeft} days left this month`;
    }

    self.registration.showNotification("CashGuard - Daily Budget", {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "daily-budget",
      data: { url: "/" },
      vibrate: [200, 100, 200],
    });
  }

  // Main app can trigger a schedule check
  if (e.data?.type === "CHECK_SCHEDULE") {
    checkAndNotify();
  }

  // Set up periodic alarm (re-check every 15 minutes)
  if (e.data?.type === "SETUP_PERIODIC_CHECK") {
    // Use the Periodic Background Sync API if available
    if (self.registration.periodicSync) {
      self.registration.periodicSync.register("daily-budget-check", {
        minInterval: 15 * 60 * 1000, // 15 minutes
      }).catch(() => {
        // Fallback: rely on the app checking on load
      });
    }
  }
});

// Periodic Background Sync event
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "daily-budget-check") {
    e.waitUntil(checkAndNotify());
  }
});
