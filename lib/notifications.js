/**
 * Browser notification system — 100% free, no API keys.
 * Uses the Notifications API + service worker for PWA push.
 * Includes daily 9 AM budget notification scheduling.
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
 */
export function checkSalaryReminder(monthData, monthName) {
  const day = new Date().getDate();
  if (day <= 5 && !monthData.allocated) {
    const key = `cashguard_reminded_${new Date().toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    notify(
      "Salary Allocation Reminder",
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
      "Overspending Alert",
      `You've spent Rs ${todaySpent.toLocaleString()} today — limit was Rs ${dailyBudget.toLocaleString()}`,
      "overspend-alert"
    );
  }
}

/** Register the service worker and set up daily notifications. */
export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    // Set up periodic check for daily notifications
    if (reg.active) {
      reg.active.postMessage({ type: "SETUP_PERIODIC_CHECK" });
      reg.active.postMessage({ type: "CHECK_SCHEDULE" });
    }

    // Listen for budget data requests from SW
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "GET_DAILY_BUDGET") {
        sendBudgetToSW();
      }
    });

    // Schedule a check using setTimeout for 9 AM
    scheduleNext9AM();

  } catch (e) {
    console.log("SW registration failed:", e);
  }
}

/**
 * Send current budget data to the service worker.
 * This is called when the SW requests budget info for notifications.
 */
function sendBudgetToSW() {
  try {
    const raw = localStorage.getItem("cashguard_data_v5");
    if (!raw) return;
    const state = JSON.parse(raw);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const day = now.getDate();
    const totalDays = new Date(year, month, 0).getDate();
    const todayStr = now.toISOString().split("T")[0];

    const mk = `${year}-${String(month).padStart(2, "0")}`;
    const md = state.months?.[mk] || { expenses: [], extraIncome: [] };
    const extraIncome = (md.extraIncome || []).reduce((s, e) => s + e.amount, 0);
    const totalIncome = (state.salary || 300000) + extraIncome;

    // Calculate fixed expenses for this month
    let fixedTotal = 0;
    for (const exp of (state.fixedExpenses || [])) {
      if (exp.everyMonth || (exp.months && exp.months.includes(month))) {
        fixedTotal += exp.amount;
      }
    }

    const available = totalIncome - fixedTotal;
    const spending = Math.round(available * 0.6);
    const totalExpenses = (md.expenses || []).reduce((s, e) => s + e.amount, 0);
    const todayExpenses = (md.expenses || []).filter((e) => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
    const remaining = Math.max(spending - totalExpenses, 0);
    const dailyBudget = Math.floor(remaining / Math.max(totalDays - day + 1, 1));

    navigator.serviceWorker.controller?.postMessage({
      type: "DAILY_BUDGET_DATA",
      dailyBudget,
      todaySpent: todayExpenses,
      daysLeft: totalDays - day,
    });
  } catch (err) {
    console.log("Error sending budget to SW:", err);
  }
}

/**
 * Schedule a timeout to fire at the next 9:00 AM.
 * When it fires, triggers the SW check and reschedules for next day.
 */
function scheduleNext9AM() {
  const now = new Date();
  const next9 = new Date(now);
  next9.setHours(9, 0, 0, 0);

  // If it's already past 9 AM today, schedule for tomorrow
  if (now >= next9) {
    next9.setDate(next9.getDate() + 1);
  }

  const msUntil9 = next9.getTime() - now.getTime();

  // Only set timeout if it's less than 24 hours (sanity check)
  if (msUntil9 > 0 && msUntil9 <= 86400000) {
    setTimeout(() => {
      // Trigger the notification
      if (navigator.serviceWorker?.controller) {
        sendBudgetToSW();
        navigator.serviceWorker.controller.postMessage({ type: "CHECK_SCHEDULE" });
      } else {
        // Fallback: direct notification
        try {
          const raw = localStorage.getItem("cashguard_data_v5");
          if (raw) {
            const state = JSON.parse(raw);
            const now2 = new Date();
            const month2 = now2.getMonth() + 1;
            const year2 = now2.getFullYear();
            const day2 = now2.getDate();
            const totalDays2 = new Date(year2, month2, 0).getDate();
            const mk2 = `${year2}-${String(month2).padStart(2, "0")}`;
            const md2 = state.months?.[mk2] || { expenses: [], extraIncome: [] };
            const extraInc = (md2.extraIncome || []).reduce((s, e) => s + e.amount, 0);
            const totalInc = (state.salary || 300000) + extraInc;
            let ft = 0;
            for (const exp of (state.fixedExpenses || [])) {
              if (exp.everyMonth || (exp.months && exp.months.includes(month2))) ft += exp.amount;
            }
            const avail = totalInc - ft;
            const spend = Math.round(avail * 0.6);
            const totExp = (md2.expenses || []).reduce((s, e) => s + e.amount, 0);
            const rem = Math.max(spend - totExp, 0);
            const db = Math.floor(rem / Math.max(totalDays2 - day2 + 1, 1));

            notify(
              "CashGuard - Daily Budget",
              `Today's spending limit is Rs ${db.toLocaleString()} | ${totalDays2 - day2} days left`,
              "daily-budget"
            );
          }
        } catch {}
      }

      // Reschedule for next day
      scheduleNext9AM();
    }, msUntil9);
  }
}
