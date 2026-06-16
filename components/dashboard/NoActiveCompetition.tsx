import { FITNESS_TIPS, TEAM_COLORS } from "@/lib/points";
import { Sparkles } from "lucide-react";
import type { BodyScanMetric, LastCompetitionResult } from "@/types";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const SCAN_META: Record<BodyScanMetric, { label: string; unit: string; betterWhenLower: boolean | null }> = {
  body_fat: { label: "Body Fat", unit: "%", betterWhenLower: true },
  muscle_mass: { label: "Muscle Mass", unit: "lbs", betterWhenLower: false },
  weight: { label: "Weight", unit: "lbs", betterWhenLower: null },
};

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
          <div className="bg-orange-50 dark:bg-orange-950/40 px-6 py-5 text-center border-b border-orange-100 dark:border-orange-800">
            <p className="text-xs uppercase tracking-wide text-orange-600 dark:text-orange-400 font-medium">{lastResult.competition_name} · Final Result</p>
            <div className="text-5xl mt-2">{MEDAL[lastResult.rank] ?? "🎉"}</div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {lastResult.team_name} finished {ordinal(lastResult.rank)}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">out of {lastResult.total_teams} teams</p>
          </div>

          <div className="p-4">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Final Standings</h2>
            <div className="space-y-2">
              {lastResult.standings.map((t) => {
                const colors = TEAM_COLORS[t.color] ?? TEAM_COLORS.orange;
                const isMine = t.id === lastResult.team_id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isMine ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800" : ""}`}
                  >
                    <span className="w-6 text-center text-sm font-bold text-slate-400 dark:text-slate-500">{MEDAL[t.rank] ?? `#${t.rank}`}</span>
                    <span className={`flex-1 font-medium truncate ${colors.text}`}>
                      {t.name}{isMine && <span className="text-orange-500 dark:text-orange-400 text-xs font-semibold ml-1.5">you</span>}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{t.total} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Member's own body scan summary */}
      {lastResult?.body_scan && lastResult.body_scan.rows.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Your Body Scan Results</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">From {lastResult.body_scan.scan_count} scan{lastResult.body_scan.scan_count === 1 ? "" : "s"} this competition.</p>
          <div className="space-y-3">
            {lastResult.body_scan.rows.map((r) => {
              const meta = SCAN_META[r.metric];
              let color = "text-slate-500 dark:text-slate-400";
              if (r.change != null && r.change !== 0 && meta.betterWhenLower !== null) {
                const good = meta.betterWhenLower ? r.change < 0 : r.change > 0;
                color = good ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400";
              }
              return (
                <div key={r.metric} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{meta.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 dark:text-slate-500">{r.first ?? "—"}{meta.unit}</span>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{r.latest ?? "—"}{meta.unit}</span>
                    {r.change != null && (
                      <span className={`font-semibold w-16 text-right ${color}`}>
                        {r.change > 0 ? "+" : ""}{r.change.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 dark:bg-orange-950/50 rounded-2xl mb-3">
          <Sparkles className="w-7 h-7 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hi {displayName}! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          {lastResult
            ? "That competition has wrapped up. Hang tight — your gym manager will start the next one soon!"
            : "There's no active competition right now. Check back soon — your gym manager will start one!"}{" "}
          In the meantime, here are some healthy habits to keep up.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-1">
          Daily Fitness Tips
        </h2>
        <div className="space-y-3">
          {FITNESS_TIPS.map((t) => (
            <div key={t.title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
