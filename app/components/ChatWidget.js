"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { formatPKR, computeAllocations, getTotalExpenses, getDailyBudget, getDaysInMonth } from "@/lib/calculations";
import { getFixedForMonth, getTotalIncome } from "@/lib/sync-store";
import { MONTH_NAMES, SAVINGS_TARGETS } from "@/lib/constants";

export default function ChatWidget({ state, monthKey, monthData }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Assalam o Alaikum! I'm your CashGuard AI advisor. Ask me anything about your finances — should you lend money? Can you afford something? How to save more? I know your complete financial picture. 💰" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function buildContext() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const day = now.getDate();
    const totalDays = getDaysInMonth(month, year);

    const totalIncome = getTotalIncome(state, monthKey);
    const { items, total: fixedTotal } = getFixedForMonth(state, month);
    const alloc = computeAllocations(totalIncome, fixedTotal, items);
    const totalExp = getTotalExpenses(monthData.expenses);
    const remaining = Math.max(alloc.spending - totalExp, 0);
    const dailyBudget = getDailyBudget(remaining, day, totalDays);

    const paidBills = Object.entries(items).filter(([k]) => monthData.paidBills[k]).length;
    const totalBills = Object.keys(items).length;

    const recentExp = monthData.expenses.slice(-10).map(e => `${e.date}: ${e.category} - ${formatPKR(e.amount)}${e.notes ? ` (${e.notes})` : ""}`).join("\n");

    return `
Date: ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
Month: ${MONTH_NAMES[month]} ${year}

INCOME:
- Base Salary: ${formatPKR(state.salary)}
- Extra Income This Month: ${formatPKR(totalIncome - state.salary)}
- Total Income: ${formatPKR(totalIncome)}

FIXED EXPENSES (${paidBills}/${totalBills} paid):
${Object.entries(items).map(([k, v]) => `- ${v.label}: ${formatPKR(v.amount)} ${monthData.paidBills[k] ? "✅ PAID" : "⏳ UNPAID"}`).join("\n")}
Total Fixed: ${formatPKR(fixedTotal)}

BUDGET ALLOCATION (60/25/15 split):
- Available After Bills: ${formatPKR(alloc.available)}
- Spending Budget: ${formatPKR(alloc.spending)}
- Car Fund Target: ${formatPKR(alloc.carFund)}
- Emergency Fund Target: ${formatPKR(alloc.emergencyFund)}

SPENDING STATUS:
- Total Spent This Month: ${formatPKR(totalExp)}
- Spending Remaining: ${formatPKR(remaining)}
- Daily Budget: ${formatPKR(dailyBudget)}
- Days Left: ${totalDays - day}

SAVINGS:
- Car Fund: ${formatPKR(state.savings.carFund.total)} / ${formatPKR(SAVINGS_TARGETS.carFund.target)} (${state.savings.carFund.total >= SAVINGS_TARGETS.carFund.target ? "COMPLETE" : `${formatPKR(SAVINGS_TARGETS.carFund.target - state.savings.carFund.total)} remaining`})
- Emergency Fund: ${formatPKR(state.savings.emergencyFund.total)} / ${formatPKR(SAVINGS_TARGETS.emergencyFund.target)}
- Car Fund Saved This Month: ${monthData.savingsChecked.carFund ? "YES ✅" : "NO ⏳"}
- Emergency Saved This Month: ${monthData.savingsChecked.emergencyFund ? "YES ✅" : "NO ⏳"}

RECENT EXPENSES:
${recentExp || "No expenses logged yet"}
`.trim();
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, financialContext: buildContext() }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((m) => [...m, { role: "bot", text: `⚠️ ${data.error}` }]);
      } else {
        setMessages((m) => [...m, { role: "bot", text: data.reply }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "⚠️ Could not connect. Check your internet." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Chat toggle button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-[88px] sm:bottom-24 left-4 sm:left-5 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-600 text-white shadow-xl shadow-purple-500/30 flex items-center justify-center z-40 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-0 sm:inset-auto sm:bottom-20 sm:left-4 sm:right-4 sm:top-auto sm:max-w-md z-50 flex flex-col bg-white dark:bg-slate-900 sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 dark:sm:border-slate-800 sm:max-h-[70vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">CashGuard AI</p>
                <p className="text-[10px] text-slate-400">Your financial advisor</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scroll">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-slate-100 dark:bg-slate-800 rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 pb-[env(safe-area-inset-bottom)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about your finances..."
                  className="input !py-2.5 !text-sm flex-1"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 disabled:opacity-30 cursor-pointer active:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
