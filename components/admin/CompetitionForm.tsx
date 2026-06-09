"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toDateString } from "@/lib/points";
import type { BodyScanMetric } from "@/types";

interface EditingCompetition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  body_scan_enabled?: boolean;
  body_scan_metrics?: BodyScanMetric[];
  body_scan_goal_points?: number;
  body_scan_winner_points?: number;
}

interface Props {
  open: boolean;
  competition?: EditingCompetition | null;
  onClose: () => void;
  onSaved: () => void;
}

const METRIC_LABELS: { key: BodyScanMetric; label: string }[] = [
  { key: "body_fat", label: "% Body fat" },
  { key: "muscle_mass", label: "Skeletal muscle mass (lbs)" },
  { key: "weight", label: "Weight (lbs)" },
];

export function CompetitionForm({ open, competition, onClose, onSaved }: Props) {
  const isEdit = !!competition;
  const today = toDateString(new Date());
  const in90 = toDateString(new Date(Date.now() + 90 * 86400000));

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(in90);
  const [teamNames, setTeamNames] = useState<string[]>(["Team 1", "Team 2", "Team 3", "Team 4"]);
  // Body scan
  const [bodyScanEnabled, setBodyScanEnabled] = useState(false);
  const [metrics, setMetrics] = useState<BodyScanMetric[]>([]);
  const [goalPoints, setGoalPoints] = useState(50);
  const [winnerPoints, setWinnerPoints] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (competition) {
      setName(competition.name);
      setStartDate(competition.start_date);
      setEndDate(competition.end_date);
      setBodyScanEnabled(!!competition.body_scan_enabled);
      setMetrics(competition.body_scan_metrics ?? []);
      setGoalPoints(competition.body_scan_goal_points ?? 50);
      setWinnerPoints(competition.body_scan_winner_points ?? 100);
    } else {
      setName("");
      setStartDate(today);
      setEndDate(in90);
      setTeamNames(["Team 1", "Team 2", "Team 3", "Team 4"]);
      setBodyScanEnabled(false);
      setMetrics([]);
      setGoalPoints(50);
      setWinnerPoints(100);
    }
    setError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition, open]);

  function updateTeam(i: number, value: string) {
    setTeamNames((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  }
  function addTeam() { setTeamNames((prev) => [...prev, `Team ${prev.length + 1}`]); }
  function removeTeam(i: number) { setTeamNames((prev) => prev.filter((_, idx) => idx !== i)); }

  function toggleMetric(m: BodyScanMetric) {
    setMetrics((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Enter a competition name."); return; }
    if (endDate < startDate) { setError("End date can't be before the start date."); return; }
    if (bodyScanEnabled && metrics.length === 0) { setError("Pick at least one body scan metric."); return; }

    const bodyScan = {
      body_scan_enabled: bodyScanEnabled,
      body_scan_metrics: bodyScanEnabled ? metrics : [],
      body_scan_goal_points: bodyScanEnabled ? Math.max(0, goalPoints) : 0,
      body_scan_winner_points: bodyScanEnabled ? Math.max(0, winnerPoints) : 0,
    };

    setSaving(true);
    let res: Response;
    if (isEdit) {
      res = await fetch("/api/admin/competitions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: competition!.id, name: name.trim(), start_date: startDate, end_date: endDate, ...bodyScan }),
      });
    } else {
      const clean = teamNames.map((t) => t.trim()).filter(Boolean);
      if (clean.length < 2) { setError("Add at least 2 teams."); setSaving(false); return; }
      res = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, team_names: clean, ...bodyScan }),
      });
    }

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
          <DialogTitle>{isEdit ? "Edit Competition" : "New Competition"}</DialogTitle>
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

          {!isEdit ? (
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
          ) : (
            <p className="text-xs text-slate-400">
              Manage this competition&apos;s teams and members on the{" "}
              <a href="/admin/teams" className="text-orange-600 hover:underline">Teams</a> page.
            </p>
          )}

          {/* Body scan */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={bodyScanEnabled} onChange={(e) => setBodyScanEnabled(e.target.checked)} className="w-4 h-4 accent-orange-600" />
              <span className="text-sm font-medium text-slate-700">Enable body scan</span>
            </label>
            {bodyScanEnabled && (
              <div className="space-y-3 pl-1">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Track which metrics?</Label>
                  {METRIC_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={metrics.includes(key)} onChange={() => toggleMetric(key)} className="w-4 h-4 accent-orange-600" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Points for first scan</Label>
                    <Input type="number" min={0} value={goalPoints} onChange={(e) => setGoalPoints(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Winning team bonus</Label>
                    <Input type="number" min={0} value={winnerPoints} onChange={(e) => setWinnerPoints(Number(e.target.value))} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Members earn the first-scan points by submitting a scan. You declare the winning team on the Body Scan page.</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create & Start"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
