"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoalForm } from "@/components/admin/GoalForm";
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshLabel } from "@/lib/points";
import type { Goal } from "@/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  async function fetchGoals() {
    const res = await fetch("/api/admin/goals");
    const data = await res.json();
    setGoals(data.goals ?? []);
    setCompetitionId(data.competition_id ?? null);
    setLoading(false);
  }
  useEffect(() => { fetchGoals(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch("/api/admin/goals", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Goal deleted."); fetchGoals(); } else toast.error("Could not delete.");
  }

  async function toggleActive(goal: Goal) {
    const res = await fetch("/api/admin/goals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, is_active: !goal.is_active }),
    });
    if (res.ok) fetchGoals();
  }

  if (!loading && !competitionId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Challenges</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No active competition. Start one in{" "}
          <a href="/admin/competitions" className="text-orange-600 hover:underline">Competitions</a>{" "}
          to add challenges.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Challenges</h1>
          <p className="text-slate-500 text-sm mt-0.5">{goals.filter((g) => g.is_active).length} active</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> New Challenge
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">No challenges yet. Create your first one!</div>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => {
            const refresh = refreshLabel(goal);
            return (
              <div key={goal.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 ${goal.is_active ? "border-orange-200" : "border-slate-200 opacity-70"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 truncate">{goal.title}</h3>
                    <Badge variant="outline" className={goal.is_active ? "border-orange-300 text-orange-700 bg-orange-50" : "text-slate-400"}>
                      {goal.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">{goal.points} pts</Badge>
                    {goal.target_count > 1 && (
                      <Badge variant="outline" className="text-slate-600">×{goal.target_count}</Badge>
                    )}
                    {refresh && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                        <RefreshCw className="w-2.5 h-2.5" /> {refresh}
                      </span>
                    )}
                  </div>
                  {goal.description && <p className="text-xs text-slate-400 mt-1 truncate">{goal.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(goal)} className="text-xs text-slate-500 hover:text-slate-800 h-8">
                    {goal.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(goal); setFormOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {competitionId && (
        <GoalForm open={formOpen} goal={editing} competitionId={competitionId} onClose={() => setFormOpen(false)} onSaved={fetchGoals} />
      )}
    </div>
  );
}
