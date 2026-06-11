"use client";

interface Point {
  date: string;
  value: number;
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

// Simple, dependency-free SVG line chart for one body-scan metric over time.
export function MetricLineChart({
  label,
  unit,
  color,
  points,
}: {
  label: string;
  unit: string;
  color: string;
  points: Point[];
}) {
  if (points.length === 0) return null;

  const W = 320, H = 150;
  const padL = 10, padR = 10, padT = 18, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const pad = dataMax === dataMin ? 1 : (dataMax - dataMin) * 0.15;
  const lo = dataMin - pad;
  const hi = dataMax + pad;
  const span = hi - lo;

  const n = points.length;
  const x = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const y = (v: number) => padT + (1 - (v - lo) / span) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const areaPath =
    n > 1
      ? `${linePath} L ${x(n - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : "";

  const last = points[n - 1].value;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
        <span className="text-sm font-bold" style={{ color }}>{last}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label} over time`}>
        {/* top & bottom gridlines */}
        <line x1={padL} y1={padT} x2={W - padR} y2={padT} stroke="#f1f5f9" strokeWidth={1} />
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#f1f5f9" strokeWidth={1} />

        {n > 1 && <path d={areaPath} fill={color} opacity={0.08} />}
        {n > 1 && (
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={3} fill="#fff" stroke={color} strokeWidth={2} />
        ))}

        {/* y range labels */}
        <text x={padL} y={padT - 6} fontSize="9" fill="#94a3b8">{dataMax}{unit}</text>
        <text x={padL} y={padT + plotH + 13} fontSize="9" fill="#94a3b8">{dataMin}{unit}</text>

        {/* x date labels */}
        <text x={x(0)} y={H - 5} fontSize="8" fill="#94a3b8" textAnchor="start">{shortDate(points[0].date)}</text>
        {n > 1 && (
          <text x={x(n - 1)} y={H - 5} fontSize="8" fill="#94a3b8" textAnchor="end">{shortDate(points[n - 1].date)}</text>
        )}
      </svg>
      {n === 1 && <p className="text-xs text-slate-400 text-center mt-1">Log another scan to see your trend line.</p>}
    </div>
  );
}
