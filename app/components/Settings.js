"use client";

import { useState } from "react";
import { formatPKR, computeAllocations } from "@/lib/calculations";
import { SUGGESTED_SPLITS, MONTH_NAMES } from "@/lib/constants";
import { setSalary, updateSettings, exportToCSV, getFixedForMonth, addFixedExpense, updateFixedExpense, deleteFixedExpense } from "@/lib/store";
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { ModalSheet } from "./AnimatedPage";

export default function Settings({ state, setState, monthKey, monthData }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [salaryInput, setSalaryInput] = useState(state.salary);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showExpenseEditor, setShowExpenseEditor] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // New expense form
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newEveryMonth, setNewEveryMonth] = useState(true);
  const [newMonths, setNewMonths] = useState([]);

  // Edit form
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editEveryMonth, setEditEveryMonth] = useState(true);
  const [editMonths, setEditMonths] = useState([]);

  function handleSaveSalary() {
    setState({ ...setSalary({ ...state }, Number(salaryInput)) });
  }

  function handleAddExpense() {
    if (!newLabel || !newAmount) return;
    setState({ ...addFixedExpense({ ...state }, { label: newLabel, amount: Number(newAmount), everyMonth: newEveryMonth, months: newEveryMonth ? [] : newMonths }) });
    setNewLabel(""); setNewAmount(""); setNewEveryMonth(true); setNewMonths([]); setShowAddExpense(false);
  }

  function startEdit(exp) {
    setEditingId(exp.id); setEditLabel(exp.label); setEditAmount(exp.amount); setEditEveryMonth(exp.everyMonth); setEditMonths(exp.months || []);
  }

  function handleSaveEdit() {
    setState({ ...updateFixedExpense({ ...state }, editingId, { label: editLabel, amount: Number(editAmount), everyMonth: editEveryMonth, months: editEveryMonth ? [] : editMonths }) });
    setEditingId(null);
  }

  function handleDeleteExpense(id) {
    if (confirm("Delete this fixed expense?")) setState({ ...deleteFixedExpense({ ...state }, id) });
  }

  function toggleMonth(monthNum, current, setter) {
    setter(current.includes(monthNum) ? current.filter((m) => m !== monthNum) : [...current, monthNum]);
  }

  function toggle(key) {
    setState({ ...updateSettings({ ...state }, { [key]: !state.settings[key] }) });
    if (key === "darkMode") document.documentElement.classList.toggle("dark", !state.settings.darkMode);
  }

  function handleExport() {
    const csv = exportToCSV(state);
    const b = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = `cashguard-${monthKey}.csv`; a.click(); URL.revokeObjectURL(u);
  }

  // Planner data
  const plannerMonths = [];
  for (let m = 4; m <= 12; m++) {
    const { items, total } = getFixedForMonth(state, m);
    const alloc = computeAllocations(state.salary, total, items);
    plannerMonths.push({ month: m, ...alloc });
  }

  const monthShort = ["", "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-3 sm:space-y-4 pb-4">
      {/* Salary */}
      <div className="card">
        <h3 className="text-sm font-bold mb-1">Monthly Salary</h3>
        <p className="text-xs text-slate-400 mb-3">Everything auto-splits using 60/25/15</p>
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} className="input-lg flex-1" />
          <button onClick={handleSaveSalary} className="btn-primary shrink-0">Save</button>
        </div>
      </div>

      {/* Fixed Expenses Editor */}
      <div className="card">
        <button onClick={() => setShowExpenseEditor(!showExpenseEditor)} className="w-full flex items-center justify-between cursor-pointer">
          <div>
            <h3 className="text-sm font-bold">Fixed Expenses</h3>
            <p className="text-xs text-slate-400">{state.fixedExpenses.length} items — tap to edit, add, or remove</p>
          </div>
          {showExpenseEditor ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showExpenseEditor && (
          <div className="mt-4 space-y-2">
            {state.fixedExpenses.map((exp) => {
              const isEditing = editingId === exp.id;
              return (
                <div key={exp.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="input !py-2 !text-sm" placeholder="Label" />
                      <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="input !py-2 !text-sm" placeholder="Amount" />
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editEveryMonth} onChange={(e) => setEditEveryMonth(e.target.checked)} className="checkbox-blue" />
                        Every month
                      </label>
                      {!editEveryMonth && (
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <button key={m} onClick={() => toggleMonth(m, editMonths, setEditMonths)}
                              className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${editMonths.includes(m) ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                              {monthShort[m]}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 !py-2 !text-xs"><X className="w-3 h-3" /> Cancel</button>
                        <button onClick={handleSaveEdit} className="btn-primary flex-1 !py-2 !text-xs"><Save className="w-3 h-3" /> Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exp.label}</p>
                        <p className="text-[10px] text-slate-400">
                          {exp.everyMonth ? "Every month" : `Months: ${exp.months.map((m) => monthShort[m]).join(", ")}`}
                        </p>
                      </div>
                      <span className="money-sm">{formatPKR(exp.amount)}</span>
                      <button onClick={() => startEdit(exp)} className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center cursor-pointer text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add new */}
            {showAddExpense ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 space-y-2">
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="input !py-2 !text-sm" placeholder="Expense name (e.g. Car Insurance)" />
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="input !py-2 !text-sm" placeholder="Amount (PKR)" />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newEveryMonth} onChange={(e) => setNewEveryMonth(e.target.checked)} className="checkbox-blue" />
                  Every month
                </label>
                {!newEveryMonth && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Select months:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <button key={m} onClick={() => toggleMonth(m, newMonths, setNewMonths)}
                          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${newMonths.includes(m) ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                          {monthShort[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowAddExpense(false)} className="btn-secondary flex-1 !py-2 !text-xs">Cancel</button>
                  <button onClick={handleAddExpense} disabled={!newLabel || !newAmount} className="btn-success flex-1 !py-2 !text-xs disabled:opacity-30">Add</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddExpense(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 font-semibold flex items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:text-blue-500">
                <Plus className="w-4 h-4" /> Add New Fixed Expense
              </button>
            )}
          </div>
        )}
      </div>

      {/* Monthly Planner */}
      <div className="card">
        <button onClick={() => setShowPlanner(!showPlanner)} className="w-full flex items-center justify-between cursor-pointer">
          <h3 className="text-sm font-bold">Monthly Planner — {year}</h3>
          {showPlanner ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showPlanner && (
          <div className="mt-4 space-y-2">
            {plannerMonths.map((p) => {
              const cur = p.month === month;
              const past = p.month < month;
              return (
                <div key={p.month} className={`rounded-xl p-3 text-sm ${cur ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700" : past ? "opacity-50 bg-slate-50 dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800"}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold ${cur ? "text-blue-600" : ""}`}>{MONTH_NAMES[p.month]} {cur && "← Running"}</span>
                  </div>
                  <div className="text-xs space-y-0.5 text-slate-500">
                    <div className="flex justify-between"><span>Salary</span><span className="mono">{formatPKR(p.salary)}</span></div>
                    <div className="flex justify-between text-red-500"><span>Fixed</span><span className="mono">-{formatPKR(p.fixedTotal)}</span></div>
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300"><span>Available</span><span className="mono">{formatPKR(p.available)}</span></div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                      <div className="flex justify-between"><span>💳 Spending (60%)</span><span className="mono font-semibold text-blue-600">{formatPKR(p.spending)}</span></div>
                      <div className="flex justify-between"><span>🚗 Car Fund (25%)</span><span className="mono font-semibold text-purple-600">{formatPKR(p.carFund)}</span></div>
                      <div className="flex justify-between"><span>🛡️ Emergency (15%)</span><span className="mono font-semibold text-emerald-600">{formatPKR(p.emergencyFund)}</span></div>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-x-3 text-[10px] text-slate-400">
                    {Object.entries(p.fixedItems).map(([k, v]) => <span key={k}>{v.label}: {formatPKR(v.amount)}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toggles */}
      {[
        { key: "disciplineMode", title: "Discipline Mode", desc: "Blocks expenses above daily limit" },
        { key: "darkMode", title: "Dark Mode", desc: "Easy on the eyes" },
      ].map((t) => (
        <div key={t.key} className="card flex items-center justify-between">
          <div><p className="font-semibold text-sm">{t.title}</p><p className="text-xs text-slate-400">{t.desc}</p></div>
          <button onClick={() => toggle(t.key)} className={`toggle-track ${state.settings[t.key] ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}>
            <div className={`toggle-thumb ${state.settings[t.key] ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}

      <button onClick={handleExport} className="w-full card text-sm font-semibold text-blue-600 text-center py-3 cursor-pointer">📤 Export Data to CSV</button>
      <button onClick={() => { if (confirm("Delete ALL data?")) { localStorage.clear(); window.location.reload(); } }} className="w-full text-center text-red-400 text-xs font-medium py-2 cursor-pointer">Reset All Data</button>
    </div>
  );
}
