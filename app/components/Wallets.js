"use client";

import { formatPKR, getFixedExpensesForMonth, getTotalExpenses, getEstimatedCompletion } from "@/lib/calculations";
import { SAVINGS_TARGETS } from "@/lib/constants";
import ProgressBar from "./ProgressBar";

export default function Wallets({ state, monthData }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { items: fixedItems, total: fixedTotal } = getFixedExpensesForMonth(month, year);
  const totalExpenses = getTotalExpenses(monthData.expenses);
  const spendingBudget = monthData.allocations.spending || 0;
  const spendingRemaining = Math.max(spendingBudget - totalExpenses, 0);
  const spendingPct = spendingBudget > 0 ? Math.round(((spendingBudget - spendingRemaining) / spendingBudget) * 100) : 0;

  const car = state.savings.carFund;
  const emergency = state.savings.emergencyFund;
  const lastCarAmt = car.contributions.length > 0 ? car.contributions[car.contributions.length - 1].amount : 0;
  const lastEmAmt = emergency.contributions.length > 0 ? emergency.contributions[emergency.contributions.length - 1].amount : 0;

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold px-1">Wallets</h2>

      {/* Bills Wallet */}
      <div className="gradient-purple rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl">🔒</div>
          <div>
            <h3 className="font-bold text-lg">Bills Wallet</h3>
            <p className="text-purple-200 text-xs">Auto-deducted on salary day</p>
          </div>
          <p className="ml-auto text-2xl font-bold mono">{formatPKR(fixedTotal)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 space-y-2">
          {Object.entries(fixedItems).map(([k, item]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-purple-100">{item.label}</span>
              <span className="font-semibold mono">{formatPKR(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-xs text-purple-200">
          🔒 Protected — cannot be used for daily expenses
        </div>
      </div>

      {/* Spending Wallet */}
      <div className="card border-2 border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">💳</div>
          <div>
            <h3 className="font-bold text-lg">Spending Wallet</h3>
            <p className="text-slate-400 text-xs">Decreases with daily expenses</p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Remaining</p>
            <p className={`text-3xl font-bold mono ${spendingRemaining < spendingBudget * 0.2 ? "text-red-500" : "text-blue-600"}`}>
              {formatPKR(spendingRemaining)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Budget</p>
            <p className="text-xl font-bold mono text-slate-400">{formatPKR(spendingBudget)}</p>
          </div>
        </div>

        <ProgressBar
          current={spendingBudget - spendingRemaining} target={spendingBudget || 1}
          color={spendingPct > 80 ? "red" : spendingPct > 60 ? "yellow" : "blue"} height="h-3" showPct={false}
        />
        <p className="text-xs text-slate-400 text-right mt-1 mono">{spendingPct}% spent</p>
      </div>

      {/* Savings Wallet */}
      <div className="card border-2 border-emerald-100 dark:border-emerald-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl">🏦</div>
          <div>
            <h3 className="font-bold text-lg">Savings Wallet</h3>
            <p className="text-slate-400 text-xs">Only grows — no withdrawals</p>
          </div>
          <p className="ml-auto text-xl font-bold mono text-emerald-600">{formatPKR(car.total + emergency.total)}</p>
        </div>

        {/* Car Fund */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">🚗 Car Repair Fund</span>
            <span className="text-sm font-bold mono">
              {formatPKR(car.total)} <span className="text-slate-400 font-normal">/ {formatPKR(SAVINGS_TARGETS.carFund.target)}</span>
            </span>
          </div>
          <ProgressBar current={car.total} target={SAVINGS_TARGETS.carFund.target} color="blue" height="h-2.5" showPct={false} />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>Monthly: {formatPKR(lastCarAmt)}</span>
            <span>ETA: {getEstimatedCompletion(car.total, SAVINGS_TARGETS.carFund.target, lastCarAmt)}</span>
          </div>
          {car.contributions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
              {car.contributions.slice(-4).map((c, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-400">
                  <span>{c.month}</span>
                  <span className="text-emerald-500 font-semibold mono">+{formatPKR(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Fund */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">🛡️ Emergency Fund</span>
            <span className="text-sm font-bold mono">
              {formatPKR(emergency.total)} <span className="text-slate-400 font-normal">/ {formatPKR(SAVINGS_TARGETS.emergencyFund.target)}</span>
            </span>
          </div>
          <ProgressBar current={emergency.total} target={SAVINGS_TARGETS.emergencyFund.target} color="emerald" height="h-2.5" showPct={false} />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>Monthly: {formatPKR(lastEmAmt)}</span>
            <span>ETA: {getEstimatedCompletion(emergency.total, SAVINGS_TARGETS.emergencyFund.target, lastEmAmt)}</span>
          </div>
        </div>

        {state.settings.disciplineMode && (
          <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">🔒 Discipline Mode — Savings locked</p>
          </div>
        )}
      </div>
    </div>
  );
}
