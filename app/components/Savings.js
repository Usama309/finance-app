"use client";

import { useState } from "react";
import { formatPKR, computeAllocations, getEstimatedCompletion } from "@/lib/calculations";
import { SAVINGS_TARGETS, MONTH_NAMES } from "@/lib/constants";
import { toggleSavingsChecked, addExtraSaving, deleteExtraSaving, getTotalIncome, getFixedForMonth } from "@/lib/sync-store";
import { usePrivacy } from "../context/PrivacyContext";
import ProgressBar from "./ProgressBar";
import { Eye, EyeOff } from "lucide-react";

export default function Savings({ state, setState, monthKey, monthData }) {
  const { hidden, toggle: togglePrivacy, maskAmount } = usePrivacy();
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraFund, setExtraFund] = useState("carFund");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraDesc, setExtraDesc] = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const totalIncome = getTotalIncome(state, monthKey);
  const { items: fi, total: ft } = getFixedForMonth(state, month);
  const alloc = computeAllocations(totalIncome, ft, fi);

  const car = state.savings.carFund;
  const emergency = state.savings.emergencyFund;
  const carChecked = monthData.savingsChecked.carFund || false;
  const emChecked = monthData.savingsChecked.emergencyFund || false;

  function handleToggle(fund, amount) {
    if (amount <= 0) return;
    setState({ ...toggleSavingsChecked({ ...state }, monthKey, fund, amount) });
  }

  function handleAddExtra() {
    const amt = parseFloat(extraAmount);
    if (!amt || amt <= 0) return;
    setState({ ...addExtraSaving({ ...state }, monthKey, extraFund, amt, extraDesc) });
    setExtraAmount(""); setExtraDesc(""); setShowAddExtra(false);
  }

  function handleDeleteExtra(id) {
    setState({ ...deleteExtraSaving({ ...state }, monthKey, id) });
  }

  const lastCar = alloc.carFund;
  const lastEm = alloc.emergencyFund;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold">Savings</h2>
        <button onClick={togglePrivacy} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer">
          {hidden ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-blue-500" />}
        </button>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2 text-center">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {MONTH_NAMES[month]} {year} — Savings Targets
        </p>
      </div>

      {/* This Month's Savings Checkboxes */}
      <div className="card">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mark as Saved — {MONTH_NAMES[month]}</h3>
        {alloc.carFund > 0 && (
          <label className="flex items-center gap-3 py-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer">
            <input type="checkbox" checked={carChecked} onChange={() => handleToggle("carFund", alloc.carFund)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <div className="flex-1">
              <span className={`text-sm ${carChecked ? "line-through text-slate-400" : "font-medium"}`}>Car Fund (25%)</span>
              {carChecked && <p className="text-[10px] text-emerald-500 font-semibold">Saved this month</p>}
            </div>
            <span className={`text-sm mono ${carChecked ? "text-emerald-500 font-bold" : "font-semibold"}`}>{maskAmount(formatPKR(alloc.carFund))}</span>
          </label>
        )}
        {alloc.emergencyFund > 0 && (
          <label className="flex items-center gap-3 py-3 cursor-pointer">
            <input type="checkbox" checked={emChecked} onChange={() => handleToggle("emergencyFund", alloc.emergencyFund)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            <div className="flex-1">
              <span className={`text-sm ${emChecked ? "line-through text-slate-400" : "font-medium"}`}>Emergency Fund (15%)</span>
              {emChecked && <p className="text-[10px] text-emerald-500 font-semibold">Saved this month</p>}
            </div>
            <span className={`text-sm mono ${emChecked ? "text-emerald-500 font-bold" : "font-semibold"}`}>{maskAmount(formatPKR(alloc.emergencyFund))}</span>
          </label>
        )}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm font-bold">
          <span>Total for {MONTH_NAMES[month]}</span>
          <span className="mono">{maskAmount(formatPKR(alloc.carFund + alloc.emergencyFund))}</span>
        </div>
      </div>

      {/* Car Fund Progress */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">&#128663;</span>
          <h3 className="font-bold">Car Repair Fund</h3>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Saved so far</span>
          <span className="font-bold mono">{maskAmount(formatPKR(car.total))} / {maskAmount(formatPKR(SAVINGS_TARGETS.carFund.target))}</span>
        </div>
        <ProgressBar current={car.total} target={SAVINGS_TARGETS.carFund.target} color="blue" height="h-3" showPct={false} />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Remaining: {maskAmount(formatPKR(Math.max(SAVINGS_TARGETS.carFund.target - car.total, 0)))}</span>
          <span>ETA: {getEstimatedCompletion(car.total, SAVINGS_TARGETS.carFund.target, lastCar)}</span>
        </div>
        {car.contributions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">History</p>
            {car.contributions.slice().reverse().slice(0, 6).map((c, i) => (
              <div key={i} className="flex justify-between text-xs py-1">
                <span className="text-slate-400">{c.month} — {c.type === "extra" ? (c.description || "Extra") : "Monthly"}</span>
                <span className="text-emerald-500 font-semibold mono">+{maskAmount(formatPKR(c.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Fund Progress */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">&#128737;&#65039;</span>
          <h3 className="font-bold">Emergency Fund</h3>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Saved so far</span>
          <span className="font-bold mono">{maskAmount(formatPKR(emergency.total))} / {maskAmount(formatPKR(SAVINGS_TARGETS.emergencyFund.target))}</span>
        </div>
        <ProgressBar current={emergency.total} target={SAVINGS_TARGETS.emergencyFund.target} color="emerald" height="h-3" showPct={false} />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Remaining: {maskAmount(formatPKR(Math.max(SAVINGS_TARGETS.emergencyFund.target - emergency.total, 0)))}</span>
          <span>ETA: {getEstimatedCompletion(emergency.total, SAVINGS_TARGETS.emergencyFund.target, lastEm)}</span>
        </div>
        {emergency.contributions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">History</p>
            {emergency.contributions.slice().reverse().slice(0, 6).map((c, i) => (
              <div key={i} className="flex justify-between text-xs py-1">
                <span className="text-slate-400">{c.month} — {c.type === "extra" ? (c.description || "Extra") : "Monthly"}</span>
                <span className="text-emerald-500 font-semibold mono">+{maskAmount(formatPKR(c.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra Savings This Month */}
      {monthData.extraSavings.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extra Savings — {MONTH_NAMES[month]}</h3>
          {monthData.extraSavings.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <span className="text-sm">{e.fund === "carFund" ? "&#128663;" : "&#128737;&#65039;"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{e.fund === "carFund" ? "Car Fund" : "Emergency Fund"}</p>
                {e.description && <p className="text-xs text-slate-400 truncate">{e.description}</p>}
                <p className="text-[10px] text-slate-400">{e.date}</p>
              </div>
              <span className="text-sm font-bold mono text-emerald-500">+{maskAmount(formatPKR(e.amount))}</span>
              <button onClick={() => handleDeleteExtra(e.id)} className="text-slate-300 hover:text-red-500 text-lg cursor-pointer">&#215;</button>
            </div>
          ))}
        </div>
      )}

      {/* Add Extra Saving */}
      {showAddExtra ? (
        <div className="card">
          <h3 className="font-bold text-sm mb-3">Add Extra Saving</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Which fund?</label>
              <div className="flex gap-2">
                <button onClick={() => setExtraFund("carFund")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${extraFund === "carFund" ? "bg-blue-100 text-blue-700 border-2 border-blue-500" : "bg-slate-100 dark:bg-slate-800 border-2 border-transparent"}`}>
                  Car Fund
                </button>
                <button onClick={() => setExtraFund("emergencyFund")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${extraFund === "emergencyFund" ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500" : "bg-slate-100 dark:bg-slate-800 border-2 border-transparent"}`}>
                  Emergency
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Amount (PKR)</label>
              <input type="number" inputMode="numeric" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)}
                placeholder="0" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-lg font-bold mono focus:outline-none focus:border-blue-500" autoFocus />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Description (optional)</label>
              <input type="text" value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)}
                placeholder="e.g. Freelance payment, bonus..." className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddExtra(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-sm">Cancel</button>
              <button onClick={handleAddExtra} disabled={!extraAmount || parseFloat(extraAmount) <= 0}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-30">Add</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddExtra(true)}
          className="w-full card text-center text-emerald-600 font-semibold text-sm py-3 active:bg-emerald-50 cursor-pointer">
          + Add Extra Saving
        </button>
      )}
    </div>
  );
}
