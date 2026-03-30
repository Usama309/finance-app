import { SUGGESTED_SPLITS } from "./constants";

/**
 * Auto-compute allocations for a month. Uses same 60/25/15 split as planner.
 * fixedTotal comes from store.getFixedForMonth() now (editable expenses).
 */
export function computeAllocations(salary, fixedTotal, fixedItems) {
  const available = salary - fixedTotal;
  const spending      = Math.round(available * SUGGESTED_SPLITS.spending / 100);
  const carFund       = Math.round(available * SUGGESTED_SPLITS.carFund / 100);
  const emergencyFund = Math.round(available * SUGGESTED_SPLITS.emergencyFund / 100);
  return { salary, fixedItems, fixedTotal, available, spending, carFund, emergencyFund };
}

export function getDailyBudget(spendingRemaining, currentDay, totalDays) {
  return Math.floor(spendingRemaining / Math.max(totalDays - currentDay + 1, 1));
}

export function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function getExpensesForDate(expenses, dateStr) {
  return expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
}

export function getTotalExpenses(expenses) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function getSpendingByCategory(expenses) {
  const m = {};
  for (const e of expenses) m[e.category] = (m[e.category] || 0) + e.amount;
  return m;
}

export function getDailyTotals(expenses, upToDay, year, month) {
  const out = [];
  for (let d = 1; d <= upToDay; d++) {
    const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out.push({ day: d, date: ds, total: getExpensesForDate(expenses, ds) });
  }
  return out;
}

export function getHealthStatus(spent, budget) {
  if (budget <= 0) return "danger";
  const r = spent / budget;
  if (r <= 0.7) return "safe";
  if (r <= 1.0) return "warn";
  return "danger";
}

export function formatPKR(amount) {
  if (amount == null) return "Rs 0";
  const n = Math.round(amount);
  return `${n < 0 ? "-" : ""}Rs ${Math.abs(n).toLocaleString("en-PK")}`;
}

export function getEstimatedCompletion(current, target, monthly) {
  if (monthly <= 0) return "N/A";
  const rem = target - current;
  if (rem <= 0) return "Complete!";
  const m = Math.ceil(rem / monthly);
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
