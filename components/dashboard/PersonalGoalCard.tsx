"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { refreshLabel } from "@/lib/points";
import type { PersonalGoalWithProgress } from "@/types";

interface Props {
  goal: PersonalGoalWithProgress;
  manage?: boolean;
  onLog: () => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PersonalGoalCard({ goal, manage, onLog, onEdit, onDelete }: Props) {
  const [busy, setBusy] = useState(false);
  const multi = goal.target_count > 1;
  const refresh = refreshLabel(goal);

  async function handleLog() {
    setBusy(true);
    try { await onLog(); } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      goal.completed
        ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Target className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{goal.title}</h3>
            {refresh && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {refresh}
              </span>
            )}
          </div>
          {goal.description && <p className="text-sm text-slate-500 dark:text-slate-400 ml-6">{goal.description}</p>}

          {multi && (
            <div className="ml-6 mt-3">
              <div className="flex items-center gap-2 mb-1">
                {Array.from({ length: goal.target_count }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < goal.progress ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-600"}`} />
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{goal.progress}/{goal.target_count} completed</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {goal.completed ? (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
            </div>
          ) : (
            <Button size="sm" onClick={handleLog} disabled={busy} className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5">
              {busy ? "..." : multi ? "Log One" : "Complete"}
            </Button>
          )}
          {manage && (
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-1" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
