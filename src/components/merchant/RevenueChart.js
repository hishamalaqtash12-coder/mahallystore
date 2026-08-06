"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

/**
 * Pure SVG area chart — zero dependencies, zero ApexCharts 'null.node' crashes.
 * Works safely with React StrictMode double-invocation and rapid re-renders.
 */
export default function RevenueChart({ data = [], delta = "0%", days = 7, onRangeChange }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];

  const W = 600;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 36, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const { points, yTicks, maxVal } = useMemo(() => {
    if (safeData.length === 0) return { points: [], yTicks: [], maxVal: 0 };
    const vals = safeData.map(d => parseFloat(d.revenue) || 0);
    const maxVal = Math.max(...vals, 0.01);
    const niceMax = Math.ceil(maxVal / 10) * 10 || 10;
    const step = innerW / (safeData.length - 1 || 1);
    const points = safeData.map((d, i) => ({
      x: PAD.left + i * step,
      y: PAD.top + innerH - (parseFloat(d.revenue) / niceMax) * innerH,
      label: d.name,
      revenue: parseFloat(d.revenue) || 0,
    }));
    const yCount = 4;
    const yTicks = Array.from({ length: yCount + 1 }, (_, i) => ({
      val: ((niceMax / yCount) * i).toFixed(1),
      y: PAD.top + innerH - (i / yCount) * innerH,
    }));
    return { points, yTicks, maxVal: niceMax };
  }, [safeData]);

  const pathD = points.length < 2
    ? ""
    : points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
      }, "");

  const areaD = points.length < 2
    ? ""
    : `${pathD} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`;

  const isEmpty = safeData.length === 0;

  return (
    <div className="bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-0.5">
          <h4 className="text-[17px] font-bold text-zinc-900">
            {isAr ? "أداء الإيرادات" : "Revenue Performance"}
          </h4>
          <p className="text-[12px] text-zinc-500">
            {isAr ? `تحليلات آخر ${days} أيام` : `Analytics for the last ${days} days`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-50 p-1 rounded-md border border-zinc-200">
          {[
            { label: "7D", value: 7 },
            { label: "15D", value: 15 },
            { label: "30D", value: 30 },
            { label: "90D", value: 90 },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onRangeChange?.(opt.value)}
              className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                days === opt.value
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
          <input
            type="number"
            placeholder="Days..."
            className="w-14 bg-transparent text-[11px] font-bold text-zinc-700 focus:outline-none px-1"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const val = parseInt(e.target.value);
                if (val > 0 && val <= 365) onRangeChange?.(val);
              }
            }}
          />
        </div>
      </div>

      {/* Chart area */}
      {isEmpty ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-zinc-300 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span className="text-sm text-zinc-400">No revenue data for this period.</span>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden group">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
            aria-label="Revenue chart"
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#febd69" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#febd69" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines + labels */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={PAD.left} y1={t.y}
                  x2={W - PAD.right} y2={t.y}
                  stroke="#f1f1f1" strokeWidth="1"
                />
                <text
                  x={PAD.left - 6} y={t.y + 4}
                  textAnchor="end" fontSize="10" fill="#999" fontFamily="inherit"
                >
                  {t.val}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {points.map((p, i) => {
              // Show every nth label to avoid crowding
              const every = Math.ceil(points.length / 8);
              if (i % every !== 0 && i !== points.length - 1) return null;
              return (
                <text
                  key={i}
                  x={p.x} y={H - 6}
                  textAnchor="middle" fontSize="10" fill="#999" fontFamily="inherit"
                >
                  {p.label}
                </text>
              );
            })}

            {/* Filled area */}
            <path d={areaD} fill="url(#revenueGrad)" />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#febd69"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points + tooltip on hover */}
            {points.map((p, i) => (
              <g key={i} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                <circle
                  cx={p.x} cy={p.y} r="4"
                  fill="#fff" stroke="#febd69" strokeWidth="2"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
                {/* Tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={Math.min(p.x - 34, W - PAD.right - 70)} y={p.y - 36}
                    width="70" height="24" rx="5"
                    fill="#1c1c1e" opacity="0.88"
                  />
                  <text
                    x={Math.min(p.x + 1, W - PAD.right - 34)} y={p.y - 19}
                    textAnchor="middle" fontSize="10" fill="#fff" fontFamily="inherit" fontWeight="600"
                  >
                    JOD {p.revenue.toFixed(2)}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
