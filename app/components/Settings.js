"use client";

import { useState } from "react";
import { formatPKR, computeAllocations } from "@/lib/calculations";
import { DEFAULT_INCOME, SUGGESTED_SPLITS, MONTH_NAMES } from "@/lib/constants";
import { setSalary, updateSettings, exportToCSV } from "@/lib/store";

export default function Settings({ state, setState, monthKey, monthData }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [salaryInput, setSalaryInput] = useState(state.salary || DEFAULT_INCOME);

  function handleSaveSalary() {
    setState({ ...setSalary({ ...state }, Number(salaryInput)) });
  }

  function toggle(key) {
    setState({ ...updateSettings({ ...state }, { [key]: !state.settings[key] }) });
    if (key === "darkMode") document.documentElement.classList.toggle("dark", !state.settings.darkMode);
  }

  function handleExport() {
    const csv = exportToCSV(state);
    const b = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = `cashguard-${monthKey}.csv`; a.click();
    URL.revokeObjectURL(u);
  }

  // Planner — April to December, using computeAllocations for every month
  const plannerMonths = [];
  for (let m = 4; m <= 12; m++) {
    plannerMonths.push({ month: m, ...computeAllocations(state.salary, m, year) });
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Salary Input */}
      <div className="card">
        <h3 className="text-sm font-bold mb-1">Monthly Salary</h3>
        <p className="text-xs text-slate-400 mb-3">
          Enter your salary — everything else is auto-calculated using 60/25/15 split
        </p>
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)}
            className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-lg font-bold mono focus:outline-none focus:border-blue-500" />
          <button onClick={handleSaveSalary}
            className="px-5 rounded-xl bg-blue-600 text-white font-bold text-sm active:bg-blue-700">
            Save
          </button>
        </div>
        {Number(salaryInput) !== state.salary && (
          <p className="text-xs text-amber-500 mt-2">Unsaved — tap Save to apply</p>
        )}
      </div>

      {/* How it works */}
      <div className="card">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">How Allocation Works</h3>
        <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
          <p>Salary <span className="float-right mono font-semibold">{formatPKR(state.salary)}</span></p>
          <p>− Fixed Expenses (auto per month)</p>
          <p>= Available amount</p>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
            <p>→ <strong>{SUGGESTED_SPLITS.spending}%</strong> Spending budget</p>
            <p>→ <strong>{SUGGESTED_SPLITS.carFund}%</strong> Car Fund savings</p>
            <p>→ <strong>{SUGGESTED_SPLITS.emergencyFund}%</strong> Emergency Fund savings</p>
          </div>
        </div>
      </div>

      {/* Monthly Planner */}
      <div className="card">
        <h3 className="text-sm font-bold mb-3">Monthly Planner — {year}</h3>
        <div className="space-y-2">
          {plannerMonths.map((p) => {
            const cur = p.month === month;
            const isPast = p.month < month;
            return (
              <div key={p.month} className={`rounded-xl p-3 text-sm ${
                cur ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700"
                    : isPast ? "bg-slate-50/50 dark:bg-slate-800/50 opacity-60"
                    : "bg-slate-50 dark:bg-slate-800"
              }`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`font-bold ${cur ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {MONTH_NAMES[p.month]} {cur && "← Running Month"}
                  </span>
                </div>
                <div className="text-xs space-y-0.5 text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Salary</span>
                    <span className="mono">{formatPKR(p.salary)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Fixed Expenses</span>
                    <span className="mono">-{formatPKR(p.fixedTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>Available</span>
                    <span className="mono">{formatPKR(p.available)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                    <div className="flex justify-between">
                      <span>💳 Spending (60%)</span>
                      <span className="mono font-semibold text-blue-600">{formatPKR(p.spending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🚗 Car Fund (25%)</span>
                      <span className="mono font-semibold text-purple-600">{formatPKR(p.carFund)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🛡️ Emergency (15%)</span>
                      <span className="mono font-semibold text-emerald-600">{formatPKR(p.emergencyFund)}</span>
                    </div>
                  </div>
                </div>
                {/* Bills breakdown */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-x-3 text-[10px] text-slate-400">
                  {Object.entries(p.fixedItems).map(([k, v]) => (
                    <span key={k}>{v.label}: {formatPKR(v.amount)}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      {[
        { key: "disciplineMode", icon: "🔒", title: "Discipline Mode", desc: "Blocks expenses above daily limit" },
        { key: "darkMode", icon: "🌙", title: "Dark Mode", desc: "Easy on the eyes" },
      ].map((t) => (
        <div key={t.key} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{t.icon}</span>
            <div>
              <p className="font-semibold text-sm">{t.title}</p>
              <p className="text-xs text-slate-400">{t.desc}</p>
            </div>
          </div>
          <button onClick={() => toggle(t.key)}
            className={`toggle-track ${state.settings[t.key] ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}>
            <div className={`toggle-thumb ${state.settings[t.key] ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}

      <button onClick={handleExport} className="w-full card text-sm font-semibold text-blue-600 text-center py-3">
        📤 Export Data to CSV
      </button>
      <button onClick={() => { if (confirm("Delete ALL data?")) { localStorage.clear(); window.location.reload(); } }}
        className="w-full text-center text-red-400 text-xs font-medium py-2">Reset All Data</button>
    </div>
  );
}
