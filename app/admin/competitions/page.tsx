"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
import { Plus, Play, Square, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TEAM_COLORS } from "@/lib/points";

interface AdminTeam { id: string; name: string; color: string; total_points: number }
interface AdminCompetition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  teams: AdminTeam[];
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCompetition | null>(null);

  async function fetchData() {
    const res = await fetch("/api/admin/competitions");
    const data = await res.json();
    setCompetitions(data.competitions ?? []);
    setLoading(false);
  }
  useEffect(() => { fetchData(); }, []);

  const hasActive = competitions.some((c) => c.is_active);

  async function patch(id: string, action: string) {
    const res = await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { toast.success(action === "activate" ? "Competition started!" : "Competition ended."); fetchData(); }
    else toast.error(data.error ?? "Action failed.");
  }

  async function remove(id: string) {
    if (!confirm("Delete this competition and all its data? This cannot be undone.")) return;
    const res = await fetch("/api/admin/competitions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Deleted."); fetchData(); }
    else toast.error("Could not delete.");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Competitions</h1>
          <p className="text-slate-500 text-sm mt-0.5">One competition runs at a time.</p>
        </div>
        <div className="text-right">
          <Button
            size="sm"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            disabled={hasActive}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Competition
          </Button>
          {hasActive && (
            <p className="text-xs text-slate-400 mt-1.5 max-w-[200px]">End the active competition to start a new one.</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : competitions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No competitions yet. Create your first one to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.is_active ? "border-orange-300" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 text-lg">{c.name}</h2>
                    {c.is_active && <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">Active</Badge>}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{c.start_date} → {c.end_date}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.teams?.map((t) => {
                      const col = TEAM_COLORS[t.color] ?? TEAM_COLORS.orange;
                      return (
                        <span key={t.id} className={`text-xs font-medium px-2 py-1 rounded-full ${col.bg} ${col.text}`}>
                          {t.name} · {t.total_points}pts
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(c); setFormOpen(true); }} className="text-slate-600 text-xs">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                  {c.is_active ? (
                    <Button variant="outline" size="sm" onClick={() => patch(c.id, "end")} className="text-slate-600 text-xs">
                      <Square className="w-3.5 h-3.5 mr-1.5" /> End
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => patch(c.id, "activate")} className="text-orange-600 border-orange-200 text-xs">
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Start
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-red-400 hover:text-red-600 text-xs">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompetitionForm
        open={formOpen}
        competition={editing}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
