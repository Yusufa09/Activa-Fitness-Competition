"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TEAM_COLORS } from "@/lib/points";
import { Trophy, Crown } from "lucide-react";
import { toast } from "sonner";

type Metric = "body_fat" | "muscle_mass" | "weight";
const METRIC_META: Record<Metric, { label: string; unit: string }> = {
  body_fat: { label: "Body Fat", unit: "%" },
  muscle_mass: { label: "Muscle", unit: "lbs" },
  weight: { label: "Weight", unit: "lbs" },
};

interface ScanVals { body_fat: number | null; muscle_mass: number | null; weight: number | null }
interface MemberRow { enrollment_id: string; display_name: string; first: ScanVals | null; latest: ScanVals | null; scan_count: number }
interface TeamRow { id: string; name: string; color: string; is_winner: boolean; members: MemberRow[] }
interface Comp { id: string; name: string; body_scan_enabled: boolean; body_scan_metrics: Metric[]; body_scan_winner_points: number; body_scan_winner_team_id: string | null }

export default function AdminBodyScansPage() {
  const [comp, setComp] = useState<Comp | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/body-scans");
    const data = await res.json();
    setComp(data.competition ?? null);
    setTeams(data.teams ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function declareWinner(team_id: string) {
    const res = await fetch("/api/admin/body-scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "declare_winner", team_id }),
    });
    if (res.ok) { toast.success("Winning team declared! Bonus points awarded."); load(); }
    else toast.error("Could not declare winner.");
  }

  if (loading) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>;
  }

  if (!comp || !comp.body_scan_enabled) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Body Scan</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          Body scan isn&apos;t enabled for the active competition. Turn it on when creating or editing a competition.
        </div>
      </div>
    );
  }

  const metrics = comp.body_scan_metrics;

  function delta(m: Metric, first: ScanVals | null, latest: ScanVals | null) {
    if (!first || !latest || first[m] == null || latest[m] == null) return null;
    return Number(latest[m]) - Number(first[m]);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Body Scan</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {comp.name} · winner bonus: {comp.body_scan_winner_points} pts. Declare the winning team when the competition ends.
        </p>
      </div>

      <div className="space-y-4">
        {teams.map((team) => {
          const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
          return (
            <div key={team.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`px-5 py-3 flex items-center justify-between ${colors.bg}`}>
                <div className="flex items-center gap-2">
                  <h2 className={`font-bold ${colors.text}`}>{team.name}</h2>
                  {team.is_winner && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" /> Winner
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={team.is_winner ? "outline" : "default"}
                  onClick={() => declareWinner(team.id)}
                  className={team.is_winner ? "text-slate-500 text-xs" : "bg-orange-600 hover:bg-orange-700 text-white text-xs"}
                >
                  <Trophy className="w-3.5 h-3.5 mr-1.5" />
                  {team.is_winner ? "Winner ✓" : "Declare winner"}
                </Button>
              </div>

              {team.members.length === 0 ? (
                <p className="p-4 text-slate-400 text-sm text-center">No members.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="text-left px-4 py-2 font-medium">Member</th>
                      {metrics.map((m) => (
                        <th key={m} className="text-right px-4 py-2 font-medium">{METRIC_META[m].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map((mem) => (
                      <tr key={mem.enrollment_id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 text-slate-700 font-medium">
                          {mem.display_name}
                          {mem.scan_count === 0 && <span className="ml-2 text-xs text-slate-300">no scan</span>}
                        </td>
                        {metrics.map((m) => {
                          const d = delta(m, mem.first, mem.latest);
                          const f = mem.first?.[m];
                          const l = mem.latest?.[m];
                          return (
                            <td key={m} className="px-4 py-2.5 text-right">
                              {f == null ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <div className="text-xs">
                                  <span className="text-slate-500">{f}{l != null ? ` → ${l}` : ""}{METRIC_META[m].unit}</span>
                                  {d != null && (
                                    <span className={`ml-1.5 font-semibold ${d === 0 ? "text-slate-400" : d > 0 ? "text-green-600" : "text-red-500"}`}>
                                      {d > 0 ? "+" : ""}{d.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
