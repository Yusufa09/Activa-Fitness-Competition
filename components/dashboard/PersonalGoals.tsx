"use client";

import { useState } from "react";
import Link from "next/link";
import { usePersonalGoals } from "@/hooks/usePersonalGoals";
import { PersonalGoalCard } from "./PersonalGoalCard";
import { PersonalGoalForm } from "./PersonalGoalForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PersonalGoalWithProgress } from "@/types";

export function PersonalGoals({ deviceToken, manage = false }: { deviceToken: string; manage?: boolean }) {
  const { goals, loading, add, edit, remove, log } = usePersonalGoals(deviceToken);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalGoalWithProgress | null>(null);

  const skeleton = (
    <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />)}</div>
  );

  if (manage) {
    return (
      <div className="space-y-3">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Goal
        </Button>

        {loading ? skeleton : goals.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
            No personal goals yet. Add your first one above!
          </div>
        ) : (
          goals.map((g) => (
            <PersonalGoalCard
              key={g.id}
              goal={g}
              manage
              onLog={() => log(g.id)}
              onEdit={() => { setEditing(g); setFormOpen(true); }}
              onDelete={() => { if (confirm("Delete this goal?")) remove(g.id); }}
            />
          ))
        )}

        <PersonalGoalForm
          open={formOpen}
          goal={editing}
          onClose={() => setFormOpen(false)}
          onSave={(g) => (editing ? edit(editing.id, g) : add(g))}
        />
      </div>
    );
  }

  const visible = goals.filter((g) => g.active);
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Personal Goals</h2>
        <Link href="/goals" className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium">Manage →</Link>
      </div>
      {loading ? skeleton : visible.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
          No personal goals yet. <Link href="/goals" className="text-orange-600 dark:text-orange-400 hover:underline">Add some →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((g) => <PersonalGoalCard key={g.id} goal={g} onLog={() => log(g.id)} />)}
        </div>
      )}
    </div>
  );
}
