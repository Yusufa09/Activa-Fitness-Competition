"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeForm } from "@/components/admin/ChallengeForm";
import { Pencil, Trash2, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { Challenge } from "@/types";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);

  async function fetchChallenges() {
    const res = await fetch("/api/admin/challenges");
    const data = await res.json();
    setChallenges(data.challenges ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchChallenges(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this challenge? This cannot be undone.")) return;
    const res = await fetch("/api/admin/challenges", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Challenge deleted.");
      fetchChallenges();
    } else {
      toast.error("Could not delete.");
    }
  }

  async function handleToggleActive(challenge: Challenge) {
    const res = await fetch("/api/admin/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: challenge.id, is_active: !challenge.is_active }),
    });
    if (res.ok) fetchChallenges();
  }

  async function handleResetWeek() {
    if (!confirm("This will deactivate all current active challenges. You'll then add new ones. Continue?")) return;
    const active = challenges.filter((c) => c.is_active);
    await Promise.all(
      active.map((c) =>
        fetch("/api/admin/challenges", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, is_active: false }),
        })
      )
    );
    toast.success("Active challenges deactivated. Add new ones for the new week.");
    fetchChallenges();
  }

  const active = challenges.filter((c) => c.is_active);
  const inactive = challenges.filter((c) => !c.is_active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Challenges</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {active.length} active · {inactive.length} past
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetWeek}
            className="text-slate-600"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset Week
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Challenge
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              No challenges yet. Create your first one!
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 ${
                  challenge.is_active ? "border-teal-200" : "border-slate-200 opacity-70"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 truncate">{challenge.title}</h3>
                    <Badge
                      variant="outline"
                      className={challenge.is_active ? "border-teal-300 text-teal-700 bg-teal-50" : "text-slate-400"}
                    >
                      {challenge.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                      {challenge.points} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {challenge.week_start} → {challenge.week_end} · {challenge.challenge_type}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(challenge)}
                    className="text-xs text-slate-500 hover:text-slate-800 h-8"
                  >
                    {challenge.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditing(challenge); setFormOpen(true); }}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(challenge.id)}
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ChallengeForm
        open={formOpen}
        challenge={editing}
        onClose={() => setFormOpen(false)}
        onSaved={fetchChallenges}
      />
    </div>
  );
}
