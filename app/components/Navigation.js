"use client";

import { motion } from "motion/react";

const tabs = [
  { id: "dashboard", label: "Home",      icon: "🏠" },
  { id: "expenses",  label: "Expenses",  icon: "💸" },
  { id: "savings",   label: "Savings",   icon: "🏦" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "settings",  label: "Settings",  icon: "⚙️" },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50">
      <div className="flex justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`nav-item flex-1 relative ${active ? "active" : "text-slate-400 dark:text-slate-500"}`}
            >
              <motion.span
                className="text-xl leading-none"
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                {t.icon}
              </motion.span>
              <span>{t.label}</span>
              {active && (
                <motion.div
                  className="absolute -top-0.5 left-1/2 w-5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
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
