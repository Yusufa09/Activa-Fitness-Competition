"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { TEAM_COLORS } from "@/lib/points";

export function MiniLeaderboard({ competitionId }: { competitionId: string | null }) {
  const { teams, loading } = useLeaderboard(competitionId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Team Standings</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxPoints = teams[0]?.total_points ?? 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Team Standings</h3>
        <a href="/leaderboard" className="text-xs text-orange-600 hover:underline font-medium">
          Full view →
        </a>
      </div>
      <div className="space-y-3">
        {teams.map((team) => {
          const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
          const barWidth = maxPoints > 0 ? Math.round((team.total_points / maxPoints) * 100) : 0;
          return (
            <div key={team.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-slate-400 text-sm font-bold">{team.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium truncate ${colors.text}`}>{team.name}</span>
                  <span className="text-slate-500 ml-2 flex-shrink-0">{team.total_points} pts</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
