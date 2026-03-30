"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { formatPKR, computeAllocations, getDailyBudget, getDaysInMonth, getTotalExpenses, getExpensesForDate } from "@/lib/calculations";
import { MONTH_NAMES } from "@/lib/constants";
import { toggleBillPaid, toggleSavingsChecked, addExtraIncome, deleteExtraIncome, getTotalIncome } from "@/lib/store";
import { StaggerList, StaggerItem, AnimatedCard, CheckPop } from "./AnimatedPage";
import ProgressBar from "./ProgressBar";

export default function Dashboard({ state, setState, monthKey, monthData, onNavigate }) {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [incomeAmt, setIncomeAmt] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();
  const totalDays = getDaysInMonth(month, year);
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const daysLeft = totalDays - day;

  // Total income = base salary + extra income this month
  const totalIncome = getTotalIncome(state, monthKey);
  const extraIncomeTotal = totalIncome - state.salary;

  // Single source of truth — uses total income
  const alloc = computeAllocations(totalIncome, month, year);
  const totalExpenses = getTotalExpenses(monthData.expenses);
  const todayExpenses = getExpensesForDate(monthData.expenses, todayStr);
  const spendingRemaining = Math.max(alloc.spending - totalExpenses, 0);
  const dailyBudget = getDailyBudget(spendingRemaining, day, totalDays);

  const billKeys = Object.keys(alloc.fixedItems);
  const paidCount = billKeys.filter((k) => monthData.paidBills[k]).length;
  const carChecked = monthData.savingsChecked.carFund || false;
  const emChecked = monthData.savingsChecked.emergencyFund || false;

  function handleToggleBill(key) {
    setState({ ...toggleBillPaid({ ...state }, monthKey, key) });
  }
  function handleToggleSaving(fund, amount) {
    if (amount <= 0) return;
    setState({ ...toggleSavingsChecked({ ...state }, monthKey, fund, amount) });
  }
  function handleAddIncome() {
    const amt = parseFloat(incomeAmt);
    if (!amt || amt <= 0) return;
    setState({ ...addExtraIncome({ ...state }, monthKey, amt, incomeDesc) });
    setIncomeAmt(""); setIncomeDesc(""); setShowAddIncome(false);
  }
  function handleDeleteIncome(id) {
    setState({ ...deleteExtraIncome({ ...state }, monthKey, id) });
  }

  return (
    <StaggerList className="space-y-3 sm:space-y-4 pb-4">
      {/* Header */}
      <StaggerItem className="pt-1">
        <h1 className="text-lg sm:text-xl font-bold">CashGuard</h1>
        <p className="text-[11px] sm:text-xs text-slate-400">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </StaggerItem>

      {/* Current Month */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 text-center">
        <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
          {MONTH_NAMES[month]} {year} — Running Month
        </p>
      </div>

      {/* Income Section */}
      <div className="card !p-4">
        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Income — {MONTH_NAMES[month]}</h3>
        <div className="flex justify-between text-sm">
          <span>Base Salary</span>
          <span className="font-bold mono">{formatPKR(state.salary)}</span>
        </div>
        {monthData.extraIncome.map((e) => (
          <div key={e.id} className="flex justify-between items-center text-sm mt-1">
            <span className="text-emerald-600 flex-1 min-w-0 truncate">
              + {e.description || "Extra Income"} <span className="text-[10px] text-slate-400">({e.date})</span>
            </span>
            <span className="font-bold mono text-emerald-600 ml-2">{formatPKR(e.amount)}</span>
            <button onClick={() => handleDeleteIncome(e.id)} className="ml-2 text-slate-300 hover:text-red-500 text-base leading-none">×</button>
          </div>
        ))}
        {extraIncomeTotal > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-1 flex justify-between text-sm font-bold">
            <span>Total Income</span>
            <span className="mono">{formatPKR(totalIncome)}</span>
          </div>
        )}
        {showAddIncome ? (
          <div className="mt-3 space-y-2">
            <input type="number" inputMode="numeric" value={incomeAmt} onChange={(e) => setIncomeAmt(e.target.value)}
              placeholder="Amount" autoFocus
              className="w-full p-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold mono focus:outline-none focus:border-blue-500" />
            <input type="text" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)}
              placeholder="Description (e.g. Freelance, Project XYZ)"
              className="w-full p-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-500" />
            <div className="flex gap-2">
              <button onClick={() => setShowAddIncome(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold">Cancel</button>
              <button onClick={handleAddIncome} disabled={!incomeAmt || parseFloat(incomeAmt) <= 0}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-30">Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddIncome(true)} className="mt-2 w-full text-xs text-emerald-600 font-semibold text-center py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
            + Add Extra Income (Project / Freelance)
          </button>
        )}
      </div>

      {/* Month Breakdown */}
      <div className="card !p-4">
        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{MONTH_NAMES[month]} Breakdown</h3>
        <div className="space-y-1 text-[13px] sm:text-sm">
          <div className="flex justify-between">
            <span>Total Income</span>
            <span className="font-bold mono">{formatPKR(totalIncome)}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Fixed Expenses</span>
            <span className="font-bold mono">-{formatPKR(alloc.fixedTotal)}</span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex justify-between font-semibold">
            <span>Available</span>
            <span className="mono">{formatPKR(alloc.available)}</span>
          </div>
          <div className="flex justify-between text-blue-600">
            <span>→ Spending (60%)</span>
            <span className="font-bold mono">{formatPKR(alloc.spending)}</span>
          </div>
          <div className="flex justify-between text-purple-600">
            <span>→ Car Fund (25%)</span>
            <span className="font-bold mono">{formatPKR(alloc.carFund)}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>→ Emergency (15%)</span>
            <span className="font-bold mono">{formatPKR(alloc.emergencyFund)}</span>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="card !p-3 sm:!p-4">
          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold">Today&apos;s Limit</p>
          <p className="text-xl sm:text-2xl font-bold mono mt-0.5">{formatPKR(dailyBudget)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{daysLeft} days left</p>
        </div>
        <div className="card !p-3 sm:!p-4">
          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold">Today&apos;s Spent</p>
          <p className={`text-xl sm:text-2xl font-bold mono mt-0.5 ${todayExpenses > dailyBudget && dailyBudget > 0 ? "text-red-500" : "text-emerald-600"}`}>
            {formatPKR(todayExpenses)}
          </p>
          {todayExpenses > dailyBudget && dailyBudget > 0 && <p className="text-[11px] text-red-400 mt-0.5">Over limit!</p>}
        </div>
      </div>

      {/* Spending Status */}
      <div className="card !p-4">
        <div className="flex justify-between text-[13px] sm:text-sm mb-2">
          <span className="font-semibold">Spending</span>
          <span className="mono">{formatPKR(totalExpenses)} / {formatPKR(alloc.spending)}</span>
        </div>
        <ProgressBar current={totalExpenses} target={alloc.spending || 1} color={totalExpenses > alloc.spending * 0.8 ? "red" : "blue"} height="h-2" showPct={false} />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>Left: {formatPKR(spendingRemaining)}</span>
          <span>{alloc.spending > 0 ? Math.round((totalExpenses / alloc.spending) * 100) : 0}% used</span>
        </div>
      </div>

      {/* Fixed Expenses Checkboxes */}
      <div className="card !p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed Expenses</h3>
          <span className="text-[11px] text-slate-400 mono">{paidCount}/{billKeys.length}</span>
        </div>
        {Object.entries(alloc.fixedItems).map(([key, item]) => {
          const paid = monthData.paidBills[key] || false;
          return (
            <label key={key} className="flex items-center gap-2.5 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer">
              <input type="checkbox" checked={paid} onChange={() => handleToggleBill(key)}
                className="w-[18px] h-[18px] rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0" />
              <span className={`flex-1 text-[13px] sm:text-sm ${paid ? "line-through text-slate-400" : "font-medium"}`}>{item.label}</span>
              <span className={`text-[13px] sm:text-sm mono ${paid ? "text-slate-400 line-through" : "font-semibold"}`}>{formatPKR(item.amount)}</span>
            </label>
          );
        })}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[13px] sm:text-sm font-bold">
          <span>Total</span><span className="mono">{formatPKR(alloc.fixedTotal)}</span>
        </div>
        {paidCount === billKeys.length && <p className="text-[11px] text-emerald-500 font-semibold mt-1.5 text-center">All bills cleared!</p>}
      </div>

      {/* Monthly Savings Checkboxes */}
      <div className="card !p-4">
        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Savings</h3>
        {alloc.carFund > 0 && (
          <label className="flex items-center gap-2.5 py-2 border-b border-slate-50 dark:border-slate-800 cursor-pointer">
            <input type="checkbox" checked={carChecked} onChange={() => handleToggleSaving("carFund", alloc.carFund)}
              className="w-[18px] h-[18px] rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" />
            <span className={`flex-1 text-[13px] sm:text-sm ${carChecked ? "line-through text-slate-400" : "font-medium"}`}>🚗 Car Fund (25%)</span>
            <span className={`text-[13px] sm:text-sm mono ${carChecked ? "text-emerald-500 font-bold" : "font-semibold"}`}>{formatPKR(alloc.carFund)}</span>
          </label>
        )}
        {alloc.emergencyFund > 0 && (
          <label className="flex items-center gap-2.5 py-2 cursor-pointer">
            <input type="checkbox" checked={emChecked} onChange={() => handleToggleSaving("emergencyFund", alloc.emergencyFund)}
              className="w-[18px] h-[18px] rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0" />
            <span className={`flex-1 text-[13px] sm:text-sm ${emChecked ? "line-through text-slate-400" : "font-medium"}`}>🛡️ Emergency (15%)</span>
            <span className={`text-[13px] sm:text-sm mono ${emChecked ? "text-emerald-500 font-bold" : "font-semibold"}`}>{formatPKR(alloc.emergencyFund)}</span>
          </label>
        )}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[13px] sm:text-sm font-bold">
          <span>Total Savings</span><span className="mono">{formatPKR(alloc.carFund + alloc.emergencyFund)}</span>
        </div>
      </div>

      {/* Savings Progress */}
      <div className="card !p-4">
        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Savings Progress</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[13px] sm:text-sm mb-1">
              <span>🚗 Car Fund</span>
              <span className="font-bold mono">{formatPKR(state.savings.carFund.total)} / Rs 200,000</span>
            </div>
            <ProgressBar current={state.savings.carFund.total} target={200000} color="blue" height="h-2" showPct={false} />
          </div>
          <div>
            <div className="flex justify-between text-[13px] sm:text-sm mb-1">
              <span>🛡️ Emergency</span>
              <span className="font-bold mono">{formatPKR(state.savings.emergencyFund.total)} / Rs 150,000</span>
            </div>
            <ProgressBar current={state.savings.emergencyFund.total} target={150000} color="emerald" height="h-2" showPct={false} />
          </div>
        </div>
        <button onClick={() => onNavigate("savings")} className="w-full mt-2 text-[11px] text-blue-600 font-semibold text-center">
          View Details + Add Extra Savings →
        </button>
      </div>
    </StaggerList>
  );
}
