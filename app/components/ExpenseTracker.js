"use client";

import { useState } from "react";
import { formatPKR, computeAllocations, getTotalExpenses, getExpensesForDate, getDailyBudget, getDaysInMonth } from "@/lib/calculations";
import { CATEGORIES } from "@/lib/constants";
import { addExpense, deleteExpense, getTotalIncome, getFixedForMonth } from "@/lib/sync-store";
import { usePrivacy } from "../context/PrivacyContext";
import { AnimatedFAB, ModalSheet, StaggerList, StaggerItem } from "./AnimatedPage";
import { Eye, EyeOff } from "lucide-react";

export default function ExpenseTracker({ state, setState, monthKey, monthData }) {
  const { hidden, toggle: togglePrivacy, maskAmount } = usePrivacy();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();
  const totalDays = getDaysInMonth(month, year);
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const totalIncome = getTotalIncome(state, monthKey);
  const { items: fi, total: ft } = getFixedForMonth(state, month);
  const alloc = computeAllocations(totalIncome, ft, fi);
  const totalExpenses = getTotalExpenses(monthData.expenses);
  const todayExpenses = getExpensesForDate(monthData.expenses, todayStr);
  const spendingBudget = alloc.spending;
  const spendingRemaining = Math.max(spendingBudget - totalExpenses, 0);
  const dailyBudget = getDailyBudget(spendingRemaining, day, totalDays);
  const discipline = state.settings.disciplineMode;
  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (discipline && todayExpenses + amt > dailyBudget && dailyBudget > 0) {
      alert("Discipline Mode: Exceeds daily limit!");
      return;
    }
    if (amt > dailyBudget * 0.5 && dailyBudget > 0 && !confirmLarge) {
      setPendingExpense({ amount: amt, category, notes, date });
      setConfirmLarge(true);
      return;
    }
    doSubmit(amt, category, notes, date);
  }

  function doSubmit(amt, cat, n, d) {
    setState({ ...addExpense({ ...state }, monthKey, { amount: amt, category: cat, notes: n, date: d }) });
    resetForm();
  }

  function handleDelete(id) {
    setState({ ...deleteExpense({ ...state }, monthKey, id) });
  }

  function resetForm() {
    setAmount(""); setCategory("food"); setNotes(""); setDate(new Date().toISOString().split("T")[0]);
    setShowAdd(false); setConfirmLarge(false); setPendingExpense(null);
  }

  const grouped = {};
  for (const e of [...monthData.expenses].reverse()) {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold">Expenses</h2>
        <button onClick={togglePrivacy} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer">
          {hidden ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-blue-500" />}
        </button>
      </div>

      <div className="gradient-blue rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider font-semibold">Today</p>
            <p className="text-xl font-bold mono mt-0.5">{maskAmount(formatPKR(todayExpenses))}</p>
          </div>
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider font-semibold">This Month</p>
            <p className="text-xl font-bold mono mt-0.5">{maskAmount(formatPKR(totalExpenses))}</p>
          </div>
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider font-semibold">Remaining</p>
            <p className="text-xl font-bold mono mt-0.5">{maskAmount(formatPKR(spendingRemaining))}</p>
          </div>
        </div>
      </div>

      {/* Large Expense Confirm */}
      <ModalSheet show={confirmLarge && !!pendingExpense} onClose={() => setConfirmLarge(false)}>
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">&#9888;&#65039;</span>
          </div>
          <h3 className="text-lg font-bold">Large Expense</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {pendingExpense && formatPKR(pendingExpense.amount)} is over 50% of your daily budget
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfirmLarge(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold">Cancel</button>
          <button onClick={() => { if (pendingExpense) doSubmit(pendingExpense.amount, pendingExpense.category, pendingExpense.notes, pendingExpense.date); setConfirmLarge(false); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold">Confirm</button>
        </div>
      </ModalSheet>

      {/* Add Expense Sheet */}
      <ModalSheet show={showAdd} onClose={() => setShowAdd(false)}>
        <h3 className="text-lg font-bold mb-5">Add Expense</h3>
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Amount (PKR)</label>
          <input
            type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full text-4xl font-bold p-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            autoFocus
          />
        </div>
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center py-3 rounded-xl text-xs transition-all ${
                  category === c.id
                    ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 font-bold scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 border-2 border-transparent"
                }`}>
                <span className="text-2xl mb-1">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional"
              className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg disabled:opacity-30 active:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
          Add Expense
        </button>
      </ModalSheet>

      {/* Expense List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No expenses yet</p>
          <p className="text-sm text-slate-400 mt-1">Tap the + button to start tracking</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dk, exps]) => {
          const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
          const d = new Date(dk + "T00:00:00");
          return (
            <div key={dk}>
              <div className="flex justify-between items-center px-1 mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mono">{maskAmount(formatPKR(dayTotal))}</p>
              </div>
              <div className="card divide-y divide-slate-50 dark:divide-slate-800">
                {exps.map((e) => {
                  const cat = catMap[e.category] || catMap.other;
                  return (
                    <div key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: cat.color + "18" }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{cat.label}</p>
                        {e.notes && <p className="text-xs text-slate-400 truncate">{e.notes}</p>}
                        {e.source === "whatsapp" && <p className="text-[10px] text-green-500 font-medium">via WhatsApp</p>}
                      </div>
                      <p className="text-sm font-bold mono">{maskAmount(formatPKR(e.amount))}</p>
                      <button onClick={() => handleDelete(e.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 text-xl leading-none cursor-pointer">&#215;</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <AnimatedFAB onClick={() => setShowAdd(true)} className="fab gradient-blue shadow-xl shadow-blue-500/30">+</AnimatedFAB>
    </div>
  );
}
