import { FIXED_EXPENSES, SUGGESTED_SPLITS } from "./constants";

/** Get fixed expenses applicable to a specific month (1-12). */
export function getFixedExpensesForMonth(month, year) {
  const items = {};
  let total = 0;
  for (const [key, exp] of Object.entries(FIXED_EXPENSES)) {
    if (exp.everyMonth || (exp.months && exp.months.includes(month))) {
      items[key] = { label: exp.label, amount: exp.amount };
      total += exp.amount;
    }
  }
  return { items, total };
}

/**
 * Auto-compute allocations for a month given salary.
 * Uses the same percentages shown in the Monthly Planner.
 * This is the SINGLE source of truth for all numbers.
 */
export function computeAllocations(salary, month, year) {
  const { items, total: fixedTotal } = getFixedExpensesForMonth(month, year);
  const available = salary - fixedTotal;
  const spending      = Math.round(available * SUGGESTED_SPLITS.spending / 100);
  const carFund       = Math.round(available * SUGGESTED_SPLITS.carFund / 100);
  const emergencyFund = Math.round(available * SUGGESTED_SPLITS.emergencyFund / 100);

  return {
    salary,
    fixedItems: items,
    fixedTotal,
    available,
    spending,
    carFund,
    emergencyFund,
  };
}

/** Daily budget = remaining spending / days left (including today). */
export function getDailyBudget(spendingRemaining, currentDay, totalDays) {
  const daysLeft = Math.max(totalDays - currentDay + 1, 1);
  return Math.floor(spendingRemaining / daysLeft);
}

/** Days in a given month. */
export function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/** Sum of expenses on a specific date string "YYYY-MM-DD". */
export function getExpensesForDate(expenses, dateStr) {
  return expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
}

/** Total expenses in the list. */
export function getTotalExpenses(expenses) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

/** Expenses grouped by category with totals. */
export function getSpendingByCategory(expenses) {
  const m = {};
  for (const e of expenses) m[e.category] = (m[e.category] || 0) + e.amount;
  return m;
}

/** Daily totals array for charting. */
export function getDailyTotals(expenses, upToDay, year, month) {
  const out = [];
  for (let d = 1; d <= upToDay; d++) {
    const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out.push({ day: d, date: ds, total: getExpensesForDate(expenses, ds) });
  }
  return out;
}

/** Health status based on ratio of spent/budget. */
export function getHealthStatus(spent, budget) {
  if (budget <= 0) return "danger";
  const r = spent / budget;
  if (r <= 0.7) return "safe";
  if (r <= 1.0) return "warn";
  return "danger";
}

/** Format as PKR. */
export function formatPKR(amount) {
  if (amount == null) return "Rs 0";
  const n = Math.round(amount);
  const neg = n < 0;
  const abs = Math.abs(n).toLocaleString("en-PK");
  return `${neg ? "-" : ""}Rs ${abs}`;
}

/** Estimated completion month for a savings goal. */
export function getEstimatedCompletion(current, target, monthly) {
  if (monthly <= 0) return "N/A";
  const rem = target - current;
  if (rem <= 0) return "Complete!";
  const months = Math.ceil(rem / monthly);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
