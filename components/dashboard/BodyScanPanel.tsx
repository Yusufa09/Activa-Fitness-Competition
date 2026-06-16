"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MetricLineChart } from "@/components/dashboard/MetricLineChart";
import type { BodyScan, BodyScanMetric } from "@/types";

const METRIC_META: Record<BodyScanMetric, { label: string; unit: string; betterWhenLower: boolean | null; color: string }> = {
  body_fat: { label: "Body Fat", unit: "%", betterWhenLower: true, color: "#f43f5e" },
  muscle_mass: { label: "Muscle Mass", unit: "lbs", betterWhenLower: false, color: "#10b981" },
  weight: { label: "Weight", unit: "lbs", betterWhenLower: null, color: "#3b82f6" },
};

interface ScanInfo {
  competition: { body_scan_enabled: boolean; body_scan_metrics: BodyScanMetric[]; body_scan_goal_points: number } | null;
  scans: BodyScan[];
}

export function BodyScanPanel({ deviceToken }: { deviceToken: string }) {
  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/body-scans/me?token=${deviceToken}`, { cache: "no-store" });
    const data = await res.json();
    setInfo(data);
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceToken]);

  async function handleLog() {
    setSaving(true);
    const res = await fetch("/api/body-scans/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_token: deviceToken,
        body_fat: values.body_fat ?? null,
        muscle_mass: values.muscle_mass ?? null,
        weight: values.weight ?? null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Could not save."); return; }
    if (data.points_earned > 0) toast.success(`Body scan saved! +${data.points_earned} points 🎉`);
    else toast.success("Body scan saved!");
    setValues({});
    setInfo((prev) => (prev ? { ...prev, scans: data.scans } : prev));
  }

  if (loading) {
    return <div className="h-40 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />;
  }

  const metrics = info?.competition?.body_scan_metrics ?? [];
  if (!info?.competition?.body_scan_enabled) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 dark:text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
        <p className="text-sm">Body scan isn&apos;t part of this competition.</p>
      </div>
    );
  }

  const scans = info.scans ?? [];
  const first = scans[0];
  const latest = scans[scans.length - 1];
  const hasFirstScan = scans.length >= 1;
  const goalPoints = info.competition.body_scan_goal_points;

  return (
    <div className="space-y-4">
      {/* Entry form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Log a Body Scan</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 mb-4">
          {hasFirstScan ? "Add an updated scan anytime — your first and latest are compared." : `Enter your numbers below.${goalPoints > 0 ? ` Earn +${goalPoints} points for your first scan!` : ""}`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m} className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400">{METRIC_META[m].label} ({METRIC_META[m].unit})</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={values[m] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [m]: e.target.value }))}
                placeholder="0"
              />
            </div>
          ))}
        </div>
        <Button onClick={handleLog} disabled={saving} className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
          {saving ? "Saving..." : "Log Body Scan"}
        </Button>
      </div>

      {/* Progress */}
      {hasFirstScan && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Your Progress</h3>
          <div className="space-y-3">
            {metrics.map((m) => {
              const f = first?.[m];
              const l = latest?.[m];
              const meta = METRIC_META[m];
              const change = f != null && l != null ? Number(l) - Number(f) : null;
              let color = "text-slate-500 dark:text-slate-400";
              let Icon = Minus;
              if (change != null && change !== 0) {
                Icon = change > 0 ? TrendingUp : TrendingDown;
                if (meta.betterWhenLower === null) color = "text-slate-500 dark:text-slate-400";
                else {
                  const good = meta.betterWhenLower ? change < 0 : change > 0;
                  color = good ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400";
                }
              }
              return (
                <div key={m} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{meta.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 dark:text-slate-500">{f ?? "—"}{meta.unit}</span>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{l ?? "—"}{meta.unit}</span>
                    {change != null && (
                      <span className={`flex items-center gap-0.5 font-semibold ${color} w-16 justify-end`}>
                        <Icon className="w-3.5 h-3.5" />
                        {change > 0 ? "+" : ""}{change.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Only you can see these numbers.</p>
        </div>
      )}

      {/* Trends */}
      {hasFirstScan && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 px-1">Trends</h3>
          {metrics.map((m) => {
            const meta = METRIC_META[m];
            const pts = scans
              .filter((s) => s[m] != null)
              .map((s) => ({ date: s.recorded_at, value: Number(s[m]) }));
            if (pts.length === 0) return null;
            return <MetricLineChart key={m} label={meta.label} unit={meta.unit} color={meta.color} points={pts} />;
          })}
        </div>
      )}

      {/* Full history */}
      {hasFirstScan && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Scan History <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">({scans.length})</span>
          </h3>
          <div className="space-y-2">
            {[...scans].reverse().map((s, idx, arr) => {
              const isLatest = idx === 0 && arr.length > 1;
              const isFirst = idx === arr.length - 1;
              return (
                <div key={s.id} className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    <div>{new Date(s.recorded_at).toLocaleDateString()}</div>
                    <div>{new Date(s.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    {isFirst && <span className="text-orange-500 dark:text-orange-400 font-medium">first</span>}
                    {isLatest && <span className="text-orange-500 dark:text-orange-400 font-medium">latest</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end text-sm">
                    {metrics.map((m) => (
                      <span key={m} className="text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 text-xs">{METRIC_META[m].label}:</span>{" "}
                        {s[m] != null ? `${s[m]}${METRIC_META[m].unit}` : "—"}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
