/**
 * localStorage store — v4
 * Salary-driven. Enter salary once → everything auto-computes using planner percentages.
 */

const STORE_KEY = "cashguard_data_v4";

function defaults() {
  return {
    salary: 300000,        // single salary input — drives everything
    months: {},
    savings: {
      carFund:       { total: 0, contributions: [] },
      emergencyFund: { total: 0, contributions: [] },
    },
    settings: {
      disciplineMode: false,
      darkMode: false,
    },
  };
}

function defaultMonth() {
  return {
    paidBills: {},           // { rent: true, kameeti: false }
    savingsChecked: {},      // { carFund: true, emergencyFund: false }
    expenses: [],
    extraSavings: [],        // [{ id, fund, amount, date, description }]
    extraIncome: [],         // [{ id, amount, description, date }]
  };
}

export function loadState() {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    // Ensure salary field exists on old data
    if (!data.salary) data.salary = 300000;
    return data;
  } catch { return defaults(); }
}

export function saveState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function currentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthData(state, key) {
  if (!state.months[key]) state.months[key] = defaultMonth();
  const m = state.months[key];
  if (!m.paidBills) m.paidBills = {};
  if (!m.savingsChecked) m.savingsChecked = {};
  if (!m.extraSavings) m.extraSavings = [];
  if (!m.extraIncome) m.extraIncome = [];
  if (!m.expenses) m.expenses = [];
  return m;
}

export function addExpense(state, monthKey, expense) {
  const m = getMonthData(state, monthKey);
  m.expenses.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...expense,
    timestamp: new Date().toISOString(),
  });
  saveState(state);
  return state;
}

export function deleteExpense(state, monthKey, id) {
  const m = getMonthData(state, monthKey);
  m.expenses = m.expenses.filter((e) => e.id !== id);
  saveState(state);
  return state;
}

export function toggleBillPaid(state, monthKey, billKey) {
  const m = getMonthData(state, monthKey);
  m.paidBills[billKey] = !m.paidBills[billKey];
  saveState(state);
  return state;
}

/** Toggle monthly savings contribution. Auto-updates savings totals. */
export function toggleSavingsChecked(state, monthKey, fund, amount) {
  const m = getMonthData(state, monthKey);
  const wasChecked = m.savingsChecked[fund];

  if (wasChecked) {
    m.savingsChecked[fund] = false;
    state.savings[fund].total = Math.max(0, state.savings[fund].total - amount);
    state.savings[fund].contributions = state.savings[fund].contributions.filter(
      (c) => !(c.month === monthKey && c.type === "monthly")
    );
  } else {
    m.savingsChecked[fund] = true;
    state.savings[fund].total += amount;
    state.savings[fund].contributions.push({
      month: monthKey,
      amount,
      date: new Date().toISOString(),
      type: "monthly",
    });
  }
  saveState(state);
  return state;
}

export function addExtraSaving(state, monthKey, fund, amount, description) {
  const m = getMonthData(state, monthKey);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    fund, amount,
    date: new Date().toISOString().split("T")[0],
    description: description || "",
    timestamp: new Date().toISOString(),
  };
  m.extraSavings.push(entry);
  state.savings[fund].total += amount;
  state.savings[fund].contributions.push({
    month: monthKey, amount,
    date: new Date().toISOString(),
    type: "extra",
    description: description || "",
  });
  saveState(state);
  return state;
}

export function deleteExtraSaving(state, monthKey, id) {
  const m = getMonthData(state, monthKey);
  const entry = m.extraSavings.find((e) => e.id === id);
  if (entry) {
    state.savings[entry.fund].total = Math.max(0, state.savings[entry.fund].total - entry.amount);
    state.savings[entry.fund].contributions = state.savings[entry.fund].contributions.filter(
      (c) => !(c.month === monthKey && c.type === "extra" && c.amount === entry.amount && c.description === entry.description)
    );
    m.extraSavings = m.extraSavings.filter((e) => e.id !== id);
  }
  saveState(state);
  return state;
}

export function setSalary(state, salary) {
  state.salary = salary;
  saveState(state);
  return state;
}

/** Add extra income for a month (freelance, project, bonus, etc.) */
export function addExtraIncome(state, monthKey, amount, description) {
  const m = getMonthData(state, monthKey);
  m.extraIncome.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    amount,
    description: description || "",
    date: new Date().toISOString().split("T")[0],
    timestamp: new Date().toISOString(),
  });
  saveState(state);
  return state;
}

export function deleteExtraIncome(state, monthKey, id) {
  const m = getMonthData(state, monthKey);
  m.extraIncome = m.extraIncome.filter((e) => e.id !== id);
  saveState(state);
  return state;
}

/** Get total income for a month = base salary + extra income */
export function getTotalIncome(state, monthKey) {
  const m = getMonthData(state, monthKey);
  const extra = m.extraIncome.reduce((s, e) => s + e.amount, 0);
  return state.salary + extra;
}

export function updateSettings(state, s) {
  state.settings = { ...state.settings, ...s };
  saveState(state);
  return state;
}

export function exportToCSV(state) {
  const rows = ["Date,Category,Amount,Notes,Month"];
  for (const [mk, md] of Object.entries(state.months)) {
    for (const e of (md.expenses || [])) {
      rows.push(`${e.date},${e.category},${e.amount},"${(e.notes || "").replace(/"/g, '""')}",${mk}`);
    }
  }
  return rows.join("\n");
}
