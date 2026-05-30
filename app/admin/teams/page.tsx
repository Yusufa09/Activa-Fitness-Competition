"use client";

import { useEffect, useState } from "react";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { TEAM_COLORS } from "@/lib/points";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { TeamColor } from "@/types";

interface MemberRow {
  id: string;
  display_name: string;
  total_points: number;
  created_at: string;
}

interface TeamWithMembers {
  id: string;
  name: string;
  join_code: string;
  color: TeamColor;
  total_points: number;
  members: MemberRow[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Teams</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.teal;
            const isExpanded = expanded === team.id;

            return (
              <div key={team.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`p-5 flex gap-5 ${colors.bg}`}>
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    <QRCodeDisplay teamName={team.name} joinCode={team.join_code} />
                  </div>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className={`text-xl font-bold ${colors.text}`}>{team.name}</h2>
                        <p className="text-slate-500 text-sm">{team.members.length} members</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-black ${colors.text}`}>
                          {team.total_points.toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-xs">total points</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} rounded-full`}
                          style={{ width: `${Math.min(100, (team.total_points / Math.max(...teams.map((t) => t.total_points), 1)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setExpanded(isExpanded ? null : team.id)}
                      className={`mt-4 flex items-center gap-1 text-sm font-medium ${colors.text} hover:underline`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? "Hide" : "Show"} members
                    </button>
                  </div>
                </div>

                {/* Member list */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {team.members.length === 0 ? (
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
                          {[...team.members]
                            .sort((a, b) => b.total_points - a.total_points)
                            .map((member) => (
                              <tr key={member.id} className="border-t border-slate-100">
                                <td className="px-4 py-2.5 text-slate-700 font-medium">{member.display_name}</td>
                                <td className={`px-4 py-2.5 text-right font-bold ${colors.text}`}>
                                  {member.total_points}
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-400">
                                  {new Date(member.created_at).toLocaleDateString()}
                                </td>
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
