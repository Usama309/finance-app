"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { loadState, saveState, currentMonthKey, getMonthData, getTotalIncome, getFixedForMonth, subscribeToChanges, saveLocal } from "@/lib/sync-store";
import { computeAllocations, getDailyBudget, getDaysInMonth, getTotalExpenses, getExpensesForDate } from "@/lib/calculations";
import { MONTH_NAMES } from "@/lib/constants";
import { registerSW, requestPermission, checkSalaryReminder, checkSpendingAlert } from "@/lib/notifications";
import { PageTransition } from "./components/AnimatedPage";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import ExpenseTracker from "./components/ExpenseTracker";
import Savings from "./components/Savings";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import ChatWidget from "./components/ChatWidget";
import AuthPage from "./components/AuthPage";
import { Shield, Loader2 } from "lucide-react";

export default function Home() {
  const { user, profile, loading: authLoading, signOut, isConfigured } = useAuth();
  const [state, setStateRaw] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const unsubRef = useRef(null);

  const userId = (isConfigured && user?.id !== "local") ? user?.id : null;

  // Wrapped setState that saves to both local + cloud
  const setState = useCallback((s) => {
    setStateRaw(s);
    saveState(s, userId);
  }, [userId]);

  // Load state on auth change
  useEffect(() => {
    if (authLoading) return;

    async function init() {
      const s = await loadState(userId || null);
      setStateRaw(s);
      setReady(true);

      if (s.settings?.darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");

      registerSW();
      requestPermission();

      // Check reminders
      const mk = currentMonthKey();
      const md = getMonthData(s, mk);
      const now = new Date();
      const month = now.getMonth() + 1;
      checkSalaryReminder(md, MONTH_NAMES[month]);

      const totalIncome = getTotalIncome(s, mk);
      const { total: ft } = getFixedForMonth(s, month);
      const alloc = computeAllocations(totalIncome, ft, {});
      const totalExp = getTotalExpenses(md.expenses);
      const todayStr = now.toISOString().split("T")[0];
      const todaySpent = getExpensesForDate(md.expenses, todayStr);
      const remaining = Math.max(alloc.spending - totalExp, 0);
      const totalDays = getDaysInMonth(month, now.getFullYear());
      const dailyBudget = getDailyBudget(remaining, now.getDate(), totalDays);
      checkSpendingAlert(todaySpent, dailyBudget);

      // Subscribe to realtime changes if logged in
      if (userId) {
        if (unsubRef.current) unsubRef.current();
        unsubRef.current = subscribeToChanges(userId, (cloudData) => {
          setStateRaw(cloudData);
          saveLocal(cloudData);
        });
      }
    }
    init();

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [userId, authLoading]);

  // Show auth page if not logged in (after auth loads) — only if Supabase is configured
  if (!authLoading && !user && isConfigured) {
    return <AuthPage />;
  }

  // Loading state
  if (authLoading || !ready || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">CashGuard</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <p className="text-sm text-slate-400">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  const mk = currentMonthKey();
  const md = getMonthData(state, mk);
  if (!state.months[mk]) { state.months[mk] = md; saveState(state, userId); }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <main className="max-w-lg mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-20 sm:pb-24">
        <PageTransition id={tab}>
          {tab === "dashboard" && <Dashboard state={state} setState={setState} monthKey={mk} monthData={md} onNavigate={setTab} profile={profile} signOut={signOut} />}
          {tab === "expenses"  && <ExpenseTracker state={state} setState={setState} monthKey={mk} monthData={md} />}
          {tab === "savings"   && <Savings state={state} setState={setState} monthKey={mk} monthData={md} />}
          {tab === "analytics" && <Analytics state={state} monthKey={mk} monthData={md} />}
          {tab === "settings"  && <Settings state={state} setState={setState} monthKey={mk} monthData={md} profile={profile} signOut={signOut} />}
        </PageTransition>
      </main>
      <Navigation activeTab={tab} onTabChange={setTab} />
      <ChatWidget state={state} monthKey={mk} monthData={md} />
    </div>
  );
}
