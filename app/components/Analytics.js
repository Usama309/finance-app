"use client";

import { formatPKR, computeAllocations, getSpendingByCategory, getDailyTotals, getDaysInMonth, getDailyBudget, getTotalExpenses } from "@/lib/calculations";
import { CATEGORIES } from "@/lib/constants";
import { getTotalIncome } from "@/lib/store";
import BarChart from "./BarChart";
import RingChart from "./RingChart";

export default function Analytics({ state, monthKey, monthData }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();
  const totalDays = getDaysInMonth(month, year);

  const catSpend = getSpendingByCategory(monthData.expenses);
  const dailyTotals = getDailyTotals(monthData.expenses, Math.min(day, totalDays), year, month);
  const totalIncome = getTotalIncome(state, monthKey);
  const alloc = computeAllocations(totalIncome, month, year);
  const total = getTotalExpenses(monthData.expenses);
  const budget = alloc.spending;
  const remaining = Math.max(budget - total, 0);
  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const sorted = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
  const topCat = sorted[0];

  // Overspend detection
  const overspendDays = [];
  let runRem = budget;
  for (const dt of dailyTotals) {
    const db = getDailyBudget(runRem, dt.day, totalDays);
    if (dt.total > db && dt.total > 0) overspendDays.push(dt.day);
    runRem -= dt.total;
  }

  // First 10 vs rest
  const first10 = dailyTotals.filter((d) => d.day <= 10).reduce((s, d) => s + d.total, 0);
  const after10 = dailyTotals.filter((d) => d.day > 10).reduce((s, d) => s + d.total, 0);
  const frontLoaded = first10 > after10 && total > 0;

  // Bar chart data
  const maxDaily = Math.max(...dailyTotals.map((d) => d.total), 1);
  const barData = dailyTotals.map((d) => ({
    value: d.total,
    label: String(d.day),
    showLabel: d.day === 1 || d.day % 5 === 0 || d.day === totalDays,
    danger: overspendDays.includes(d.day),
  }));

  // Weekly breakdown
  const weeks = [1, 2, 3, 4, 5].map((w) => {
    const s = (w - 1) * 7 + 1;
    const e = Math.min(w * 7, totalDays);
    const t = dailyTotals.filter((d) => d.day >= s && d.day <= Math.min(e, day)).reduce((sum, d) => sum + d.total, 0);
    return { week: w, start: s, end: e, total: t, active: s <= day };
  }).filter((w) => w.active);

  const maxWeekly = Math.max(...weeks.map((w) => w.total), 1);

  // Monthly trend
  const trend = Object.entries(state.months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, d]) => {
      const [y, m] = k.split("-").map(Number);
      const a = computeAllocations(state.salary, m, y);
      return { month: k, total: getTotalExpenses(d.expenses || []), budget: a.spending };
    });

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold px-1">Analytics</h2>

      {/* Budget Ring + Key Metrics */}
      {total > 0 && (
        <div className="card">
          <div className="flex items-center justify-around">
            <div className="relative">
              <RingChart
                percent={budget > 0 ? Math.round((total / budget) * 100) : 0}
                size={110} stroke={9}
                color={total > budget * 0.8 ? "#ef4444" : total > budget * 0.6 ? "#eab308" : "#22c55e"}
                bgColor="#e2e8f0" sublabel="used"
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Budget</p>
                <p className="text-lg font-bold mono">{formatPKR(budget)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Spent</p>
                <p className="text-lg font-bold mono text-red-500">{formatPKR(total)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Left</p>
                <p className="text-lg font-bold mono text-emerald-600">{formatPKR(remaining)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {total > 0 && (
        <div className="card space-y-2.5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Insights</h3>
          {topCat && (
            <div className="flex items-center gap-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <span className="text-xl">{catMap[topCat[0]]?.icon || "📌"}</span>
              <div>
                <p className="text-sm font-semibold">Top category: {catMap[topCat[0]]?.label}</p>
                <p className="text-xs text-slate-500">{formatPKR(topCat[1])} ({Math.round((topCat[1] / total) * 100)}% of total)</p>
              </div>
            </div>
          )}
          {frontLoaded && (
            <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Front-loaded spending</p>
                <p className="text-xs text-slate-500">First 10 days: {formatPKR(first10)} vs rest: {formatPKR(after10)}</p>
              </div>
            </div>
          )}
          {overspendDays.length > 0 ? (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <span className="text-xl">🔴</span>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">{overspendDays.length} overspending day{overspendDays.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-500">Days: {overspendDays.join(", ")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">No overspending days — great discipline!</p>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Spending by Category</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
        ) : (
          <div className="space-y-3.5">
            {sorted.map(([catId, amt]) => {
              const cat = catMap[catId] || catMap.other;
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              return (
                <div key={catId}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + "18" }}>{cat.icon}</span>
                      <span className="font-medium">{cat.label}</span>
                    </span>
                    <span className="font-bold mono">{formatPKR(amt)} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full progress-fill" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Spending Bar Chart */}
      {barData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Daily Spending</h3>
          <BarChart data={barData} maxVal={maxDaily} height={140} highlightIndex={day - 1} />
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Normal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Today</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Over limit</span>
          </div>
        </div>
      )}

      {/* Weekly Breakdown */}
      {weeks.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Weekly Breakdown</h3>
          <div className="space-y-3">
            {weeks.map((w) => {
              const pct = maxWeekly > 0 ? Math.round((w.total / maxWeekly) * 100) : 0;
              return (
                <div key={w.week}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Week {w.week} <span className="text-xs">(Day {w.start}–{w.end})</span></span>
                    <span className="font-bold mono">{formatPKR(w.total)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {trend.length > 1 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Monthly Trend</h3>
          <div className="flex items-end gap-3 h-32">
            {trend.map((m) => {
              const maxT = Math.max(...trend.map((t) => Math.max(t.total, t.budget)), 1);
              const h = maxT > 0 ? (m.total / maxT) * 100 : 0;
              const over = m.budget > 0 && m.total > m.budget;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg ${over ? "bg-red-400" : "bg-emerald-400 dark:bg-emerald-600"} bar-fill`}
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <p className="text-[9px] text-slate-400 mt-1.5">{m.month.split("-")[1]}/{m.month.split("-")[0].slice(2)}</p>
                  <p className="text-[9px] font-semibold mono text-slate-500">{(m.total / 1000).toFixed(0)}k</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
