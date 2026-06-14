"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalGoalWithProgress } from "@/types";
import type { PersonalGoalInput } from "@/hooks/usePersonalGoals";

type RefreshInterval = "daily" | "weekly";

interface Props {
  open: boolean;
  goal?: PersonalGoalWithProgress | null;
  onClose: () => void;
  onSave: (g: PersonalGoalInput) => Promise<void>;
}

export function PersonalGoalForm({ open, goal, onClose, onSave }: Props) {
  const isEdit = !!goal;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(1);
  const [isRefreshable, setIsRefreshable] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>("daily");
  const [wholeCompetition, setWholeCompetition] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setTargetCount(goal.target_count);
      setIsRefreshable(goal.is_refreshable);
      setRefreshInterval((goal.refresh_interval as RefreshInterval) ?? "daily");
      setStartsAt(goal.starts_at ?? "");
      setEndsAt(goal.ends_at ?? "");
      setWholeCompetition(!goal.starts_at && !goal.ends_at);
    } else {
      setTitle(""); setDescription(""); setTargetCount(1);
      setIsRefreshable(false); setRefreshInterval("daily");
      setStartsAt(""); setEndsAt(""); setWholeCompetition(true);
    }
    setError("");
  }, [goal, open]);

  async function handleSave() {
    if (!title.trim()) { setError("Give your goal a title."); return; }
    if (!wholeCompetition && startsAt && endsAt && endsAt < startsAt) { setError("End date can't be before the start date."); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        target_count: Math.max(1, targetCount),
        is_refreshable: isRefreshable,
        refresh_interval: isRefreshable ? refreshInterval : null,
        starts_at: wholeCompetition ? null : (startsAt || null),
        ends_at: wholeCompetition ? null : (endsAt || null),
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "New Personal Goal"}</DialogTitle>
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
          <div className="space-y-1.5">
            <Label>Times to complete</Label>
            <Input type="number" min={1} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} />
            <p className="text-xs text-slate-400">Set above 1 for goals like &quot;go to the gym 3 times.&quot;</p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRefreshable} onChange={(e) => setIsRefreshable(e.target.checked)} className="w-4 h-4 accent-orange-600" />
              <span className="text-sm text-slate-700">Recurring (resets and can be done again)</span>
            </label>
            {isRefreshable && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setRefreshInterval("daily")}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border ${refreshInterval === "daily" ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"}`}>Daily</button>
                <button type="button" onClick={() => setRefreshInterval("weekly")}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border ${refreshInterval === "weekly" ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"}`}>Weekly</button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <Label className="text-slate-700">When is this goal available?</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setWholeCompetition(true)}
                className={`flex-1 text-xs px-3 py-2 rounded-lg border ${wholeCompetition ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"}`}>Whole competition</button>
              <button type="button" onClick={() => setWholeCompetition(false)}
                className={`flex-1 text-xs px-3 py-2 rounded-lg border ${!wholeCompetition ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-600"}`}>Specific dates</button>
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Goal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
