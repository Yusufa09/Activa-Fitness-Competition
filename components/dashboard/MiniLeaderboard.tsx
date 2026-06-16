"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { TEAM_COLORS, teamTotal } from "@/lib/points";

export function MiniLeaderboard({ competitionId }: { competitionId: string | null }) {
  const { teams, loading } = useLeaderboard(competitionId);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Team Standings</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxPoints = teams[0] ? teamTotal(teams[0]) : 1;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Team Standings</h3>
        <a href="/leaderboard" className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium">
          Full view →
        </a>
      </div>
      <div className="space-y-3">
        {teams.map((team) => {
          const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
          const total = teamTotal(team);
          const barWidth = maxPoints > 0 ? Math.round((total / maxPoints) * 100) : 0;
          return (
            <div key={team.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-slate-400 dark:text-slate-500 text-sm font-bold">{team.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium truncate ${colors.text}`}>{team.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">{total} pts</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
