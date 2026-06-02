"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toDateString } from "@/lib/points";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CompetitionForm({ open, onClose, onSaved }: Props) {
  const today = toDateString(new Date());
  const in90 = toDateString(new Date(Date.now() + 90 * 86400000));

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(in90);
  const [teamNames, setTeamNames] = useState<string[]>(["Team 1", "Team 2", "Team 3", "Team 4"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateTeam(i: number, value: string) {
    setTeamNames((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  }
  function addTeam() {
    setTeamNames((prev) => [...prev, `Team ${prev.length + 1}`]);
  }
  function removeTeam(i: number) {
    setTeamNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Enter a competition name."); return; }
    const clean = teamNames.map((t) => t.trim()).filter(Boolean);
    if (clean.length < 2) { setError("Add at least 2 teams."); return; }

    setSaving(true);
    const res = await fetch("/api/admin/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, team_names: clean }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to create."); return; }
    onSaved();
    onClose();
    // reset
    setName("");
    setTeamNames(["Team 1", "Team 2", "Team 3", "Team 4"]);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Competition</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Fitness Challenge" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teams (members are randomly assigned)</Label>
            {teamNames.map((tn, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={tn} onChange={(e) => updateTeam(i, e.target.value)} placeholder={`Team ${i + 1}`} />
                {teamNames.length > 2 && (
                  <button onClick={() => removeTeam(i)} className="text-slate-400 hover:text-red-500 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTeam} className="w-full text-slate-600">
              <Plus className="w-4 h-4 mr-1.5" /> Add Team
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {saving ? "Creating..." : "Create & Start"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
