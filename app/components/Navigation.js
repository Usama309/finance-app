"use client";

import { motion } from "motion/react";
import { Home, Receipt, PiggyBank, BarChart3, Settings } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Home",      Icon: Home },
  { id: "expenses",  label: "Expenses",  Icon: Receipt },
  { id: "savings",   label: "Savings",   Icon: PiggyBank },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "settings",  label: "Settings",  Icon: Settings },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 z-50">
      <div className="flex justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`nav-item flex-1 relative ${active ? "active" : "text-slate-400 dark:text-slate-500"}`}
            >
              <motion.div
                animate={active ? { scale: [1, 1.15, 1], y: -1 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <t.Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              </motion.div>
              <span className="mt-0.5">{t.label}</span>
              {active && (
                <motion.div
                  className="absolute -top-px left-1/2 w-8 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-full"
                  layoutId="nav-indicator"
                  style={{ x: "-50%" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
