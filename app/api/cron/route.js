import { NextResponse } from "next/server";

/**
 * Vercel Cron handler — runs daily at 9 AM PKT.
 * Since we use localStorage (client-side), this cron just serves as a
 * ping that triggers the PWA service worker to show notifications.
 * The actual notification logic is in the service worker + app load.
 */
export async function GET(req) {
  // Verify cron secret (optional security)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;

  const tasks = [];

  // Days 1-5: Salary allocation reminder
  if (day <= 5) {
    tasks.push("salary_reminder");
  }

  // 8th: Salary credit check
  if (day === 8) {
    tasks.push("salary_credit_check");
  }

  // Every day: Daily summary trigger
  tasks.push("daily_summary");

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    month,
    day,
    tasks,
    message: "Cron executed. Notifications handled client-side via service worker.",
  });
}
