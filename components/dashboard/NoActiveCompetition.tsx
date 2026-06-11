import { FITNESS_TIPS, TEAM_COLORS } from "@/lib/points";
import { Sparkles } from "lucide-react";
import type { LastCompetitionResult } from "@/types";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function NoActiveCompetition({
  displayName,
  lastResult,
}: {
  displayName: string;
  lastResult?: LastCompetitionResult | null;
}) {
  return (
    <div className="space-y-4">
      {/* Final placement from the most recent competition */}
      {lastResult && (
        <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 px-6 py-5 text-center border-b border-orange-100">
            <p className="text-xs uppercase tracking-wide text-orange-600 font-medium">{lastResult.competition_name} · Final Result</p>
            <div className="text-5xl mt-2">{MEDAL[lastResult.rank] ?? "🎉"}</div>
            <h1 className="text-2xl font-black text-slate-800 mt-1">
              {lastResult.team_name} finished {ordinal(lastResult.rank)}
            </h1>
            <p className="text-slate-500 text-sm mt-1">out of {lastResult.total_teams} teams</p>
          </div>

          <div className="p-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Final Standings</h2>
            <div className="space-y-2">
              {lastResult.standings.map((t) => {
                const colors = TEAM_COLORS[t.color] ?? TEAM_COLORS.orange;
                const isMine = t.id === lastResult.team_id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isMine ? "bg-orange-50 border border-orange-200" : ""}`}
                  >
                    <span className="w-6 text-center text-sm font-bold text-slate-400">{MEDAL[t.rank] ?? `#${t.rank}`}</span>
                    <span className={`flex-1 font-medium truncate ${colors.text}`}>
                      {t.name}{isMine && <span className="text-orange-500 text-xs font-semibold ml-1.5">you</span>}
                    </span>
                    <span className="text-slate-500 text-sm font-semibold">{t.total} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-3">
          <Sparkles className="w-7 h-7 text-orange-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Hi {displayName}! 👋</h1>
        <p className="text-slate-500 mt-2 text-sm">
          {lastResult
            ? "That competition has wrapped up. Hang tight — your gym manager will start the next one soon!"
            : "There's no active competition right now. Check back soon — your gym manager will start one!"}{" "}
          In the meantime, here are some healthy habits to keep up.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
          Daily Fitness Tips
        </h2>
        <div className="space-y-3">
          {FITNESS_TIPS.map((t) => (
            <div key={t.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 text-sm">{t.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
