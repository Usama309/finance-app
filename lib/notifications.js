/**
 * Browser notification system — 100% free, no API keys.
 * Uses the Notifications API + service worker for PWA push.
 */

/** Request notification permission. */
export async function requestPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Send a local notification immediately. */
export function notify(title, body, tag = "cashguard") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Use service worker notification if available (works when app is in background)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        vibrate: [200, 100, 200],
        data: { url: "/" },
      });
    });
  } else {
    new Notification(title, { body, icon: "/icon-192.png", tag });
  }
}

/**
 * Check if salary allocation reminder is needed.
 * Called on app load — if it's past the 1st and not allocated, notify.
 */
export function checkSalaryReminder(monthData, monthName) {
  const day = new Date().getDate();
  // Remind on days 1-5 if not allocated
  if (day <= 5 && !monthData.allocated) {
    // Only remind once per session
    const key = `cashguard_reminded_${new Date().toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    notify(
      "💰 Salary Allocation Reminder",
      `${monthName} budget not set yet! Open CashGuard to allocate your salary.`,
      "salary-reminder"
    );
  }
}

/**
 * Check daily spending and warn if over budget.
 */
export function checkSpendingAlert(todaySpent, dailyBudget) {
  if (dailyBudget <= 0) return;
  if (todaySpent > dailyBudget) {
    const key = `cashguard_overspend_${new Date().toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    notify(
      "🚨 Overspending Alert",
      `You've spent Rs ${todaySpent.toLocaleString()} today — limit was Rs ${dailyBudget.toLocaleString()}`,
      "overspend-alert"
    );
  }
}

/** Register the service worker. */
export async function registerSW() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.log("SW registration failed:", e);
    }
  }
}
