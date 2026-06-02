"use client";

import { useEffect, useState } from "react";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { TEAM_COLORS } from "@/lib/points";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MemberRow { display_name: string; created_at: string }
interface EnrollmentRow { id: string; points: number; member: MemberRow }
interface TeamRow {
  id: string;
  name: string;
  color: string;
  total_points: number;
  enrollments: EnrollmentRow[];
}
interface CompetitionRow { id: string; name: string }

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [competition, setCompetition] = useState<CompetitionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams ?? []);
        setCompetition(d.competition ?? null);
        setLoading(false);
      });
  }, []);

  if (!loading && !competition) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Teams</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No active competition. Start one in{" "}
          <a href="/admin/competitions" className="text-orange-600 hover:underline">Competitions</a>{" "}
          to see teams.
        </div>
      </div>
    );
  }

  const maxPoints = Math.max(...teams.map((t) => t.total_points), 1);

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
          {competition && <p className="text-slate-500 text-sm mt-0.5">{competition.name}</p>}
        </div>
        {appUrl && <QRCodeDisplay url={appUrl} label="Members scan to sign in" />}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
            const isExpanded = expanded === team.id;
            return (
              <div key={team.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`p-5 ${colors.bg}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={`text-xl font-bold ${colors.text}`}>{team.name}</h2>
                      <p className="text-slate-500 text-sm">{team.enrollments?.length ?? 0} members</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-black ${colors.text}`}>{team.total_points.toLocaleString()}</p>
                      <p className="text-slate-400 text-xs">total points</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${(team.total_points / maxPoints) * 100}%` }} />
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : team.id)} className={`mt-4 flex items-center gap-1 text-sm font-medium ${colors.text} hover:underline`}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? "Hide" : "Show"} members
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {(team.enrollments?.length ?? 0) === 0 ? (
                      <p className="p-4 text-slate-400 text-sm text-center">No members yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <th className="text-left px-4 py-2 font-medium">Name</th>
                            <th className="text-right px-4 py-2 font-medium">Points</th>
                            <th className="text-right px-4 py-2 font-medium">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...team.enrollments].sort((a, b) => b.points - a.points).map((en) => (
                            <tr key={en.id} className="border-t border-slate-100">
                              <td className="px-4 py-2.5 text-slate-700 font-medium">{en.member.display_name}</td>
                              <td className={`px-4 py-2.5 text-right font-bold ${colors.text}`}>{en.points}</td>
                              <td className="px-4 py-2.5 text-right text-slate-400">{new Date(en.member.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
