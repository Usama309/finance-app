"use client";

import { formatPKR } from "@/lib/calculations";

/**
 * Vertical bar chart for daily/weekly spending.
 */
export default function BarChart({ data, maxVal, height = 140, barColor, dangerColor, highlightIndex }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-[3px] no-scroll overflow-x-auto" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * 100 : 0;
          const isDanger = d.danger;
          const isHighlight = i === highlightIndex;
          const bg = isDanger
            ? (dangerColor || "bg-red-400")
            : isHighlight
              ? "bg-blue-500"
              : (barColor || "bg-blue-300 dark:bg-blue-700");
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-[10px] max-w-[20px] justify-end h-full">
              <div
                className={`w-full rounded-t-sm ${bg} bar-fill`}
                style={{ height: `${Math.max(h, d.value > 0 ? 3 : 0)}%` }}
                title={`${d.label}: ${formatPKR(d.value)}`}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-[3px] mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-[10px] max-w-[20px] text-center">
            {d.showLabel && (
              <span className="text-[8px] text-slate-400">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
