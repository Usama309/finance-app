"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { formatPKR, computeAllocations, getDailyBudget, getDaysInMonth, getTotalExpenses, getExpensesForDate } from "@/lib/calculations";
import { MONTH_NAMES } from "@/lib/constants";
import { toggleBillPaid, toggleSavingsChecked, addExtraIncome, deleteExtraIncome, getTotalIncome } from "@/lib/store";
import { requestPermission } from "@/lib/notifications";
import { StaggerList, StaggerItem, CheckPop, ModalSheet } from "./AnimatedPage";
import { Bell, BellRing, Plus, X, Calendar, Wallet, PiggyBank, Shield, Car, TrendingDown, TrendingUp, CircleCheck, CircleDashed, ChevronRight } from "lucide-react";
import ProgressBar from "./ProgressBar";

export default function Dashboard({ state, setState, monthKey, monthData, onNavigate }) {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [incomeAmt, setIncomeAmt] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [notifGranted, setNotifGranted] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNotifGranted(Notification.permission === "granted");
      setNotifDismissed(sessionStorage.getItem("cashguard_notif_dismissed") === "1");
    }
  }, []);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();
  const totalDays = getDaysInMonth(month, year);
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const daysLeft = totalDays - day;

  const totalIncome = getTotalIncome(state, monthKey);
  const extraIncomeTotal = totalIncome - state.salary;
  const alloc = computeAllocations(totalIncome, month, year);
  const totalExpenses = getTotalExpenses(monthData.expenses);
  const todayExpenses = getExpensesForDate(monthData.expenses, todayStr);
  const spendingRemaining = Math.max(alloc.spending - totalExpenses, 0);
  const dailyBudget = getDailyBudget(spendingRemaining, day, totalDays);
  const usedPct = alloc.spending > 0 ? Math.round((totalExpenses / alloc.spending) * 100) : 0;

  const billKeys = Object.keys(alloc.fixedItems);
  const paidCount = billKeys.filter((k) => monthData.paidBills[k]).length;
  const carChecked = monthData.savingsChecked.carFund || false;
  const emChecked = monthData.savingsChecked.emergencyFund || false;

  function handleToggleBill(key) { setState({ ...toggleBillPaid({ ...state }, monthKey, key) }); }
  function handleToggleSaving(fund, amount) { if (amount <= 0) return; setState({ ...toggleSavingsChecked({ ...state }, monthKey, fund, amount) }); }
  function handleAddIncome() {
    const amt = parseFloat(incomeAmt);
    if (!amt || amt <= 0) return;
    setState({ ...addExtraIncome({ ...state }, monthKey, amt, incomeDesc) });
    setIncomeAmt(""); setIncomeDesc(""); setShowAddIncome(false);
  }
  function handleDeleteIncome(id) { setState({ ...deleteExtraIncome({ ...state }, monthKey, id) }); }

  async function handleEnableNotifications() {
    const granted = await requestPermission();
    setNotifGranted(granted);
    if (granted) {
      new Notification("CashGuard", { body: "Notifications enabled! You'll get salary reminders and overspending alerts.", icon: "/icon-192.png" });
    }
  }
  function dismissNotifBanner() {
    setNotifDismissed(true);
    sessionStorage.setItem("cashguard_notif_dismissed", "1");
  }

  const overToday = todayExpenses > dailyBudget && dailyBudget > 0;

  return (
    <StaggerList className="space-y-3 sm:space-y-4 pb-4">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              CashGuard
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("settings")} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer">
              <Calendar className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </StaggerItem>

      {/* Notification Enable Banner */}
      {!notifGranted && !notifDismissed && typeof window !== "undefined" && "Notification" in window && (
        <StaggerItem>
          <div className="card !p-3 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Enable Notifications</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Get salary reminders & overspending alerts</p>
            </div>
            <button onClick={handleEnableNotifications} className="btn-primary !py-2 !px-3 !text-xs shrink-0">
              Allow
            </button>
            <button onClick={dismissNotifBanner} className="text-slate-400 cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </StaggerItem>
      )}

      {/* Already enabled */}
      {notifGranted && !notifDismissed && (
        <StaggerItem>
          <div className="card !p-3 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-3">
            <Bell className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 flex-1">Notifications active — you&apos;ll get reminders</p>
            <button onClick={dismissNotifBanner} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </StaggerItem>
      )}

      {/* Current Month Badge */}
      <StaggerItem>
        <div className="bg-blue-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-80" />
            <span className="text-sm font-bold">{MONTH_NAMES[month]} {year}</span>
          </div>
          <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Running Month</span>
        </div>
      </StaggerItem>

      {/* Income */}
      <StaggerItem>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Income</h3>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">Base Salary</span>
            <span className="money-sm">{formatPKR(state.salary)}</span>
          </div>
          {monthData.extraIncome.map((e) => (
            <div key={e.id} className="row-item !py-2">
              <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-600 truncate">{e.description || "Extra Income"}</p>
                <p className="text-[10px] text-slate-400">{e.date}</p>
              </div>
              <span className="money-sm text-emerald-600">{formatPKR(e.amount)}</span>
              <button onClick={() => handleDeleteIncome(e.id)} className="text-slate-300 hover:text-red-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {extraIncomeTotal > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 flex justify-between text-sm font-bold">
              <span>Total</span><span className="mono">{formatPKR(totalIncome)}</span>
            </div>
          )}
          <button onClick={() => setShowAddIncome(true)} className="w-full mt-2 text-xs text-emerald-600 font-semibold text-center py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Extra Income
          </button>
        </div>
      </StaggerItem>

      {/* Add Income Modal */}
      <ModalSheet show={showAddIncome} onClose={() => setShowAddIncome(false)}>
        <h3 className="text-lg font-bold mb-4">Add Extra Income</h3>
        <div className="space-y-3">
          <div>
            <label className="section-title block mb-1.5">Amount (PKR)</label>
            <input type="number" inputMode="numeric" value={incomeAmt} onChange={(e) => setIncomeAmt(e.target.value)}
              placeholder="0" className="input-lg" autoFocus />
          </div>
          <div>
            <label className="section-title block mb-1.5">Description</label>
            <input type="text" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)}
              placeholder="e.g. Freelance project, Bonus..." className="input" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAddIncome(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddIncome} disabled={!incomeAmt || parseFloat(incomeAmt) <= 0} className="btn-success flex-1 disabled:opacity-30">Add Income</button>
          </div>
        </div>
      </ModalSheet>

      {/* Month Breakdown */}
      <StaggerItem>
        <div className="card">
          <h3 className="section-title mb-3 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> {MONTH_NAMES[month]} Breakdown</h3>
          <div className="space-y-1.5 text-[13px] sm:text-sm">
            <div className="flex justify-between"><span>Total Income</span><span className="font-bold mono">{formatPKR(totalIncome)}</span></div>
            <div className="flex justify-between text-red-500"><span>Fixed Expenses</span><span className="font-bold mono">-{formatPKR(alloc.fixedTotal)}</span></div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 flex justify-between font-semibold">
              <span>Available</span><span className="mono">{formatPKR(alloc.available)}</span>
            </div>
            <div className="flex justify-between text-blue-600"><span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Spending (60%)</span><span className="font-bold mono">{formatPKR(alloc.spending)}</span></div>
            <div className="flex justify-between text-purple-600"><span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Car Fund (25%)</span><span className="font-bold mono">{formatPKR(alloc.carFund)}</span></div>
            <div className="flex justify-between text-emerald-600"><span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Emergency (15%)</span><span className="font-bold mono">{formatPKR(alloc.emergencyFund)}</span></div>
          </div>
        </div>
      </StaggerItem>

      {/* Today */}
      <StaggerItem>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="card">
            <p className="section-title">Today&apos;s Limit</p>
            <p className="money-lg mt-1">{formatPKR(dailyBudget)}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {daysLeft} days left</p>
          </div>
          <div className="card">
            <p className="section-title">Today&apos;s Spent</p>
            <p className={`money-lg mt-1 ${overToday ? "text-red-500" : "text-emerald-600"}`}>{formatPKR(todayExpenses)}</p>
            {overToday && <p className="text-[11px] text-red-400 mt-1 font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Over limit!</p>}
            {!overToday && todayExpenses > 0 && <p className="text-[11px] text-emerald-500 mt-1">Within budget</p>}
          </div>
        </div>
      </StaggerItem>

      {/* Spending Progress */}
      <StaggerItem>
        <div className="card">
          <div className="flex justify-between text-[13px] sm:text-sm mb-2">
            <span className="font-semibold flex items-center gap-1.5"><Wallet className="w-4 h-4 text-blue-500" /> Spending</span>
            <span className="mono">{formatPKR(totalExpenses)} / {formatPKR(alloc.spending)}</span>
          </div>
          <ProgressBar current={totalExpenses} target={alloc.spending || 1} color={usedPct > 80 ? "red" : usedPct > 60 ? "yellow" : "blue"} height="h-2.5" showPct={false} />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Left: {formatPKR(spendingRemaining)}</span>
            <span>{usedPct}% used</span>
          </div>
        </div>
      </StaggerItem>

      {/* Fixed Expenses */}
      <StaggerItem>
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="section-title flex items-center gap-1.5">Fixed Expenses</h3>
            <span className="text-[11px] font-bold text-slate-400 mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{paidCount}/{billKeys.length}</span>
          </div>
          {Object.entries(alloc.fixedItems).map(([key, item]) => {
            const paid = monthData.paidBills[key] || false;
            return (
              <CheckPop key={key} checked={paid}>
                <label className="row-item cursor-pointer">
                  <input type="checkbox" checked={paid} onChange={() => handleToggleBill(key)} className="checkbox-green" />
                  <span className={`flex-1 text-[13px] sm:text-sm ${paid ? "line-through text-slate-400" : "font-medium"}`}>{item.label}</span>
                  <span className={`text-[13px] sm:text-sm mono ${paid ? "text-slate-400 line-through" : "font-semibold"}`}>{formatPKR(item.amount)}</span>
                  {paid && <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {!paid && <CircleDashed className="w-4 h-4 text-slate-300 shrink-0" />}
                </label>
              </CheckPop>
            );
          })}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[13px] sm:text-sm font-bold">
            <span>Total</span><span className="mono">{formatPKR(alloc.fixedTotal)}</span>
          </div>
          {paidCount === billKeys.length && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-emerald-500 font-semibold mt-2 text-center flex items-center justify-center gap-1">
              <CircleCheck className="w-3.5 h-3.5" /> All bills cleared!
            </motion.p>
          )}
        </div>
      </StaggerItem>

      {/* Monthly Savings */}
      <StaggerItem>
        <div className="card">
          <h3 className="section-title mb-2 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> Monthly Savings</h3>
          {alloc.carFund > 0 && (
            <CheckPop checked={carChecked}>
              <label className="row-item cursor-pointer">
                <input type="checkbox" checked={carChecked} onChange={() => handleToggleSaving("carFund", alloc.carFund)} className="checkbox-blue" />
                <Car className="w-4 h-4 text-purple-500 shrink-0" />
                <span className={`flex-1 text-[13px] sm:text-sm ${carChecked ? "line-through text-slate-400" : "font-medium"}`}>Car Fund (25%)</span>
                <span className={`money-sm ${carChecked ? "text-emerald-500" : ""}`}>{formatPKR(alloc.carFund)}</span>
                {carChecked ? <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" /> : <CircleDashed className="w-4 h-4 text-slate-300 shrink-0" />}
              </label>
            </CheckPop>
          )}
          {alloc.emergencyFund > 0 && (
            <CheckPop checked={emChecked}>
              <label className="row-item cursor-pointer">
                <input type="checkbox" checked={emChecked} onChange={() => handleToggleSaving("emergencyFund", alloc.emergencyFund)} className="checkbox-green" />
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className={`flex-1 text-[13px] sm:text-sm ${emChecked ? "line-through text-slate-400" : "font-medium"}`}>Emergency (15%)</span>
                <span className={`money-sm ${emChecked ? "text-emerald-500" : ""}`}>{formatPKR(alloc.emergencyFund)}</span>
                {emChecked ? <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" /> : <CircleDashed className="w-4 h-4 text-slate-300 shrink-0" />}
              </label>
            </CheckPop>
          )}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[13px] sm:text-sm font-bold">
            <span>Total Savings</span><span className="mono">{formatPKR(alloc.carFund + alloc.emergencyFund)}</span>
          </div>
        </div>
      </StaggerItem>

      {/* Savings Progress */}
      <StaggerItem>
        <div className="card">
          <h3 className="section-title mb-3">Savings Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[13px] sm:text-sm mb-1">
                <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-blue-500" /> Car Fund</span>
                <span className="money-sm">{formatPKR(state.savings.carFund.total)} / Rs 200,000</span>
              </div>
              <ProgressBar current={state.savings.carFund.total} target={200000} color="blue" height="h-2.5" showPct={false} />
            </div>
            <div>
              <div className="flex justify-between text-[13px] sm:text-sm mb-1">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Emergency</span>
                <span className="money-sm">{formatPKR(state.savings.emergencyFund.total)} / Rs 150,000</span>
              </div>
              <ProgressBar current={state.savings.emergencyFund.total} target={150000} color="emerald" height="h-2.5" showPct={false} />
            </div>
          </div>
          <button onClick={() => onNavigate("savings")} className="w-full mt-3 text-xs text-blue-600 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10">
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </StaggerItem>
    </StaggerList>
  );
}
