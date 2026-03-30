"use client";

export default function ProgressBar({ current, target, color = "blue", height = "h-2.5", showPct = true, label }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  const fills = {
    blue:    "bg-blue-500",
    green:   "bg-emerald-500",
    yellow:  "bg-amber-500",
    red:     "bg-red-500",
    purple:  "bg-purple-500",
    emerald: "bg-emerald-500",
    teal:    "bg-teal-500",
  };
  const bgs = {
    blue:    "bg-blue-100 dark:bg-blue-950",
    green:   "bg-emerald-100 dark:bg-emerald-950",
    yellow:  "bg-amber-100 dark:bg-amber-950",
    red:     "bg-red-100 dark:bg-red-950",
    purple:  "bg-purple-100 dark:bg-purple-950",
    emerald: "bg-emerald-100 dark:bg-emerald-950",
    teal:    "bg-teal-100 dark:bg-teal-950",
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          {showPct && <span className="font-semibold mono">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${bgs[color] || bgs.blue} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${fills[color] || fills.blue} ${height} rounded-full progress-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
