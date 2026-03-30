/**
 * localStorage store — v5
 * Salary-driven. Editable fixed expenses. Extra income per month.
 */

const STORE_KEY = "cashguard_data_v5";

// Default fixed expenses — used as seed on first load
const DEFAULT_FIXED = [
  { id: "rent",           label: "House Rent",                     amount: 20000,  everyMonth: true, months: [] },
  { id: "kameeti",        label: "Kameeti",                        amount: 30000,  everyMonth: true, months: [] },
  { id: "iphone",         label: "iPhone Installment",             amount: 21500,  everyMonth: true, months: [] },
  { id: "employeeSalary", label: "Employee Salary",                amount: 40000,  everyMonth: true, months: [] },
  { id: "gymWifiOther",   label: "GYM / WiFi / Internet / Other",  amount: 10000,  everyMonth: true, months: [] },
  { id: "saqib",          label: "Saqib Payment",                  amount: 100000, everyMonth: false, months: [5,6,7,8,9,10,11,12] },
  { id: "hunzla",         label: "Hunzla Payment",                 amount: 150000, everyMonth: false, months: [4] },
];

function defaults() {
  return {
    salary: 300000,
    fixedExpenses: [...DEFAULT_FIXED],  // editable array
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
    paidBills: {},
    savingsChecked: {},
    expenses: [],
    extraSavings: [],
    extraIncome: [],
  };
}

export function loadState() {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    if (!data.salary) data.salary = 300000;
    if (!data.fixedExpenses) data.fixedExpenses = [...DEFAULT_FIXED];
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

/** Get fixed expenses that apply to a specific month number (1-12). */
export function getFixedForMonth(state, month) {
  const items = {};
  let total = 0;
  for (const exp of (state.fixedExpenses || [])) {
    if (exp.everyMonth || (exp.months && exp.months.includes(month))) {
      items[exp.id] = { label: exp.label, amount: exp.amount };
      total += exp.amount;
    }
  }
  return { items, total };
}

export function addExpense(state, monthKey, expense) {
  const m = getMonthData(state, monthKey);
  m.expenses.push({ id: uid(), ...expense, timestamp: new Date().toISOString() });
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

export function toggleSavingsChecked(state, monthKey, fund, amount) {
  const m = getMonthData(state, monthKey);
  const was = m.savingsChecked[fund];
  if (was) {
    m.savingsChecked[fund] = false;
    state.savings[fund].total = Math.max(0, state.savings[fund].total - amount);
    state.savings[fund].contributions = state.savings[fund].contributions.filter(
      (c) => !(c.month === monthKey && c.type === "monthly")
    );
  } else {
    m.savingsChecked[fund] = true;
    state.savings[fund].total += amount;
    state.savings[fund].contributions.push({ month: monthKey, amount, date: new Date().toISOString(), type: "monthly" });
  }
  saveState(state);
  return state;
}

export function addExtraSaving(state, monthKey, fund, amount, description) {
  const m = getMonthData(state, monthKey);
  m.extraSavings.push({ id: uid(), fund, amount, description: description || "", date: new Date().toISOString().split("T")[0], timestamp: new Date().toISOString() });
  state.savings[fund].total += amount;
  state.savings[fund].contributions.push({ month: monthKey, amount, date: new Date().toISOString(), type: "extra", description: description || "" });
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

export function setSalary(state, salary) { state.salary = salary; saveState(state); return state; }

export function addExtraIncome(state, monthKey, amount, description) {
  const m = getMonthData(state, monthKey);
  m.extraIncome.push({ id: uid(), amount, description: description || "", date: new Date().toISOString().split("T")[0], timestamp: new Date().toISOString() });
  saveState(state); return state;
}

export function deleteExtraIncome(state, monthKey, id) {
  const m = getMonthData(state, monthKey);
  m.extraIncome = m.extraIncome.filter((e) => e.id !== id);
  saveState(state); return state;
}

export function getTotalIncome(state, monthKey) {
  const m = getMonthData(state, monthKey);
  return state.salary + m.extraIncome.reduce((s, e) => s + e.amount, 0);
}

// ── Fixed expense management ──

export function addFixedExpense(state, expense) {
  state.fixedExpenses.push({ id: uid(), ...expense });
  saveState(state); return state;
}

export function updateFixedExpense(state, id, updates) {
  const idx = state.fixedExpenses.findIndex((e) => e.id === id);
  if (idx !== -1) state.fixedExpenses[idx] = { ...state.fixedExpenses[idx], ...updates };
  saveState(state); return state;
}

export function deleteFixedExpense(state, id) {
  state.fixedExpenses = state.fixedExpenses.filter((e) => e.id !== id);
  saveState(state); return state;
}

export function updateSettings(state, s) { state.settings = { ...state.settings, ...s }; saveState(state); return state; }

export function exportToCSV(state) {
  const rows = ["Date,Category,Amount,Notes,Month"];
  for (const [mk, md] of Object.entries(state.months)) {
    for (const e of (md.expenses || [])) rows.push(`${e.date},${e.category},${e.amount},"${(e.notes || "").replace(/"/g, '""')}",${mk}`);
  }
  return rows.join("\n");
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
