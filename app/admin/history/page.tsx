"use client";

import { useEffect, useState } from "react";
import { TEAM_COLORS } from "@/lib/points";

type Metric = "body_fat" | "muscle_mass" | "weight";
const METRIC_META: Record<Metric, { label: string; unit: string }> = {
  body_fat: { label: "Body Fat", unit: "%" },
  muscle_mass: { label: "Muscle", unit: "lbs" },
  weight: { label: "Weight", unit: "lbs" },
};
const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface Standing { id: string; name: string; color: string; total: number; member_count: number; rank: number }
interface BodyScanTeam { id: string; name: string; color: string; changes: Record<string, number | null> }
interface PastComp {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  standings: Standing[];
  body_scan: { metrics: Metric[]; teams: BodyScanTeam[] } | null;
}

export default function HistoryPage() {
  const [comps, setComps] = useState<PastComp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/history").then((r) => r.json()).then((d) => {
      setComps(d.competitions ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Past competitions, final standings, and body scan results.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : comps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No past competitions yet. They&apos;ll appear here once a competition ends.
        </div>
      ) : (
        <div className="space-y-6">
          {comps.map((c) => {
            const winner = c.standings[0];
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-800">{c.name}</h2>
                    <span className="text-xs text-slate-400">{c.start_date} → {c.end_date}</span>
                  </div>
                  {winner && (
                    <p className="text-sm text-slate-600 mt-1">
                      🏆 Winner: <span className="font-semibold">{winner.name}</span> ({winner.total} pts)
                    </p>
                  )}
                </div>

                {/* Final standings */}
                <div className="p-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Final Standings</h3>
                  <div className="space-y-1.5">
                    {c.standings.map((t) => {
                      const colors = TEAM_COLORS[t.color] ?? TEAM_COLORS.orange;
                      return (
                        <div key={t.id} className="flex items-center gap-3 text-sm">
                          <span className="w-6 text-center font-bold text-slate-400">{MEDAL[t.rank] ?? `#${t.rank}`}</span>
                          <span className={`flex-1 font-medium ${colors.text}`}>{t.name}</span>
                          <span className="text-slate-400 text-xs">{t.member_count} members</span>
                          <span className="text-slate-700 font-semibold w-20 text-right">{t.total} pts</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Body scan results */}
                  {c.body_scan && c.body_scan.metrics.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Body Scan — Team Total Change</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase">
                            <th className="text-left py-1 font-medium">Team</th>
                            {c.body_scan.metrics.map((m) => (
                              <th key={m} className="text-right py-1 font-medium">{METRIC_META[m].label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {c.body_scan.teams.map((t) => {
                            const colors = TEAM_COLORS[t.color] ?? TEAM_COLORS.orange;
                            return (
                              <tr key={t.id} className="border-t border-slate-100">
                                <td className={`py-1.5 font-medium ${colors.text}`}>{t.name}</td>
                                {c.body_scan!.metrics.map((m) => {
                                  const v = t.changes[m];
                                  return (
                                    <td key={m} className="py-1.5 text-right text-xs">
                                      {v == null ? (
                                        <span className="text-slate-300">—</span>
                                      ) : (
                                        <span className={`font-semibold ${v === 0 ? "text-slate-500" : v > 0 ? "text-green-600" : "text-red-500"}`}>
                                          {v > 0 ? "+" : ""}{v.toFixed(1)}{METRIC_META[m].unit}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
