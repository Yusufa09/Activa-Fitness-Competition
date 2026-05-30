"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWeekStart, getWeekEnd, toDateString } from "@/lib/points";
import type { Challenge } from "@/types";

interface Props {
  open: boolean;
  challenge?: Challenge | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ChallengeForm({ open, challenge, onClose, onSaved }: Props) {
  const isEdit = !!challenge;

  const defaultWeekStart = toDateString(getWeekStart());
  const defaultWeekEnd = toDateString(getWeekEnd());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd);
  const [type, setType] = useState<"weekly" | "attendance">("weekly");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title);
      setDescription(challenge.description ?? "");
      setPoints(challenge.points);
      setWeekStart(challenge.week_start);
      setWeekEnd(challenge.week_end);
      setType(challenge.challenge_type);
      setIsActive(challenge.is_active);
    } else {
      setTitle("");
      setDescription("");
      setPoints(100);
      setWeekStart(defaultWeekStart);
      setWeekEnd(defaultWeekEnd);
      setType("weekly");
      setIsActive(true);
    }
    setError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, open]);

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);

    const payload = { title: title.trim(), description: description.trim() || null, points, week_start: weekStart, week_end: weekEnd, challenge_type: type, is_active: isActive };

    const res = await fetch("/api/admin/challenges", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: challenge!.id, ...payload } : payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
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
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={1} max={500} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "weekly" | "attendance")}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="attendance">Attendance</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Week Start</Label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Week End</Label>
              <Input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-teal-600" />
            <span className="text-sm text-slate-700">Active (visible to members)</span>
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
