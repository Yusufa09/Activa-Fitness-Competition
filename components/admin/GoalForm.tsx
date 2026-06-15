"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Goal, RefreshInterval } from "@/types";

interface Props {
  open: boolean;
  goal?: Goal | null;
  competitionId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function GoalForm({ open, goal, competitionId, onClose, onSaved }: Props) {
  const isEdit = !!goal;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [targetCount, setTargetCount] = useState(1);
  const [isRefreshable, setIsRefreshable] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>("daily");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [wholeCompetition, setWholeCompetition] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setPoints(goal.points);
      setTargetCount(goal.target_count);
      setIsRefreshable(goal.is_refreshable);
      setRefreshInterval((goal.refresh_interval as RefreshInterval) ?? "daily");
      setStartsAt(goal.starts_at ?? "");
      setEndsAt(goal.ends_at ?? "");
      setWholeCompetition(!goal.starts_at && !goal.ends_at);
      setIsActive(goal.is_active);
    } else {
      setTitle(""); setDescription(""); setPoints(100); setTargetCount(1);
      setIsRefreshable(false); setRefreshInterval("daily");
      setStartsAt(""); setEndsAt(""); setWholeCompetition(true); setIsActive(true);
    }
    setError("");
  }, [goal, open]);

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!wholeCompetition && startsAt && endsAt && endsAt < startsAt) {
      setError("End date can't be before the start date.");
      return;
    }
    setSaving(true);

    const payload = {
      competition_id: competitionId,
      title: title.trim(),
      description: description.trim() || null,
      points,
      target_count: Math.max(1, targetCount),
      is_refreshable: isRefreshable,
      refresh_interval: isRefreshable ? refreshInterval : null,
      starts_at: wholeCompetition ? null : (startsAt || null),
      ends_at: wholeCompetition ? null : (endsAt || null),
      is_active: isActive,
    };

    const res = await fetch("/api/admin/goals", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: goal!.id, ...payload } : payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Challenge" : "New Challenge"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Drink 8 glasses of water" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Times to complete</Label>
              <Input type="number" value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} min={1} />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            Set &quot;times to complete&quot; above 1 for goals like &quot;go to the gym 3 times.&quot;
          </p>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRefreshable} onChange={(e) => setIsRefreshable(e.target.checked)} className="w-4 h-4 accent-orange-600" />
              <span className="text-sm font-medium text-slate-700">Refreshable (resets and can be earned again)</span>
            </label>
            {isRefreshable && (
              <div className="flex gap-2 pl-6">
                {(["daily", "weekly"] as RefreshInterval[]).map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setRefreshInterval(iv)}
                    className={`text-xs px-3 py-1.5 rounded-full border capitalize ${
                      refreshInterval === iv ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {iv}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <Label className="text-slate-700">When is this goal available?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWholeCompetition(true)}
                className={`flex-1 text-xs px-3 py-2 rounded-lg border ${
                  wholeCompetition ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"
                }`}
              >
                Whole competition
              </button>
              <button
                type="button"
                onClick={() => setWholeCompetition(false)}
                className={`flex-1 text-xs px-3 py-2 rounded-lg border ${
                  !wholeCompetition ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"
                }`}
              >
                Specific dates
              </button>
            </div>
            {!wholeCompetition && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Until</Label>
                  <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-orange-600" />
            <span className="text-sm text-slate-700">Active (visible to members)</span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
