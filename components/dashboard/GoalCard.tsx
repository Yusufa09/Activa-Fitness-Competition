"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshLabel } from "@/lib/points";
import type { GoalWithProgress } from "@/types";

interface Props {
  goal: GoalWithProgress;
  deviceToken: string;
  onLogged: (newTotal: number) => void;
}

export function GoalCard({ goal, deviceToken, onLogged }: Props) {
  const [busy, setBusy] = useState(false);
  const multi = goal.target_count > 1;
  const refresh = refreshLabel(goal);

  async function handleLog() {
    setBusy(true);
    const res = await fetch("/api/goals/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, goal_id: goal.id }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not log this.");
      return;
    }
    if (data.completed) {
      toast.success(`+${data.points_earned} points! Nice work!`);
    } else {
      toast.success(`Logged! ${data.progress}/${data.target} done.`);
    }
    onLogged(data.new_total ?? 0);
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        goal.completed ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200 hover:border-orange-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h3 className="font-semibold text-slate-800">{goal.title}</h3>
            {refresh && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {refresh}
              </span>
            )}
          </div>
          {goal.description && <p className="text-sm text-slate-500 ml-6">{goal.description}</p>}

          {/* Multi-count progress bar */}
          {multi && (
            <div className="ml-6 mt-3">
              <div className="flex items-center gap-2 mb-1">
                {Array.from({ length: goal.target_count }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${i < goal.progress ? "bg-orange-500" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {goal.progress}/{goal.target_count} completed
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-amber-600">+{goal.points} pts</span>
          {goal.completed ? (
            <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{multi ? "Complete!" : "Done!"}</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleLog}
              disabled={busy}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5"
            >
              {busy ? "..." : multi ? "Log One" : "Claim"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
