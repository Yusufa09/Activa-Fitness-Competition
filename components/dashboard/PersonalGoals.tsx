"use client";

import { useState } from "react";
import Link from "next/link";
import { usePersonalGoals } from "@/hooks/usePersonalGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Trash2, Pencil, Plus, X, Check, Target } from "lucide-react";
import { toast } from "sonner";

export function PersonalGoals({ deviceToken, compact = false }: { deviceToken: string; compact?: boolean }) {
  const { goals, loading, add, update, remove } = usePersonalGoals(deviceToken);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function toggle(id: string, completed: boolean) {
    try { await update(id, { completed: !completed }); } catch (e) { toast.error((e as Error).message); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try { await add(title, desc); setTitle(""); setDesc(""); toast.success("Goal added!"); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    try { await update(id, { title: editTitle, description: editDesc }); setEditingId(null); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function handleRemove(id: string) {
    if (!confirm("Delete this goal?")) return;
    try { await remove(id); } catch (e) { toast.error((e as Error).message); }
  }

  // ---- Compact (dashboard) ----
  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" /> My Goals
          </h3>
          <Link href="/goals" className="text-xs text-orange-600 hover:underline font-medium">Manage →</Link>
        </div>
        {loading ? (
          <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
        ) : goals.length === 0 ? (
          <p className="text-sm text-slate-400">
            No personal goals yet. <Link href="/goals" className="text-orange-600 hover:underline">Add one →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <button key={g.id} onClick={() => toggle(g.id, g.completed)} className="flex items-center gap-2.5 w-full text-left">
                {g.completed ? <CheckCircle2 className="w-4 h-4 text-orange-600 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <span className={`text-sm ${g.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>{g.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Full (My Goals page) ----
  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Add a Goal</h3>
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run 3 times this week"
            className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description"
            className="border-slate-300 focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <Button type="submit" disabled={busy} className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> {busy ? "Adding..." : "Add Goal"}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-slate-50 rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
          No goals yet. Add your first one above!
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <div key={g.id} className={`rounded-xl border p-4 ${g.completed ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
              {editingId === g.id ? (
                <div className="space-y-2">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border-slate-300" />
                  <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" className="border-slate-300" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(g.id)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
                      <Check className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-xs">
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(g.id, g.completed)} className="mt-0.5 flex-shrink-0">
                    {g.completed ? <CheckCircle2 className="w-5 h-5 text-orange-600" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-orange-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${g.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{g.title}</p>
                    {g.description && <p className="text-sm text-slate-500 mt-0.5">{g.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingId(g.id); setEditTitle(g.title); setEditDesc(g.description ?? ""); }} className="text-slate-400 hover:text-slate-700 p-1">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRemove(g.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
