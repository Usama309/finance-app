"use client";

/**
 * SVG donut/ring chart component.
 * Shows percentage visually with a center label.
 */
export default function RingChart({ percent, size = 120, stroke = 10, color = "#3b82f6", bgColor = "#e2e8f0", label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(percent, 0), 100);
  const offset = circ - (filled / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="ring-chart">
        {/* Background ring */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
        {/* Filled ring */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold mono">{Math.round(filled)}%</span>
        {sublabel && <span className="text-[10px] text-slate-500 dark:text-slate-400">{sublabel}</span>}
      </div>
      {label && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{label}</p>}
    </div>
  );
}
