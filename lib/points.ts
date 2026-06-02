import type { RefreshInterval, TeamColor } from "@/types";

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ISO week number, e.g. "2026-W23"
export function getIsoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// The period bucket a goal log belongs to right now
export function getPeriodKey(
  isRefreshable: boolean,
  interval: RefreshInterval | null,
  date = new Date()
): string {
  if (!isRefreshable) return "once";
  if (interval === "daily") return toDateString(date);
  if (interval === "weekly") return getIsoWeekKey(date);
  return "once";
}

export function refreshLabel(goal: { is_refreshable: boolean; refresh_interval: RefreshInterval | null }): string | null {
  if (!goal.is_refreshable) return null;
  if (goal.refresh_interval === "daily") return "Resets daily";
  if (goal.refresh_interval === "weekly") return "Resets weekly";
  return null;
}

export function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

// Distinct colors auto-assigned to teams in creation order
export const TEAM_COLOR_PALETTE: TeamColor[] = [
  "orange",
  "blue",
  "emerald",
  "rose",
  "violet",
  "amber",
  "sky",
  "teal",
];

export const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-300",  bar: "bg-orange-500" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-300",    bar: "bg-rose-500" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-300",    bar: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", bar: "bg-emerald-500" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-300",  bar: "bg-violet-500" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-300",   bar: "bg-amber-500" },
  sky:     { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-300",     bar: "bg-sky-500" },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-300",    bar: "bg-teal-500" },
};

// Basic fitness tips shown when no competition is active (no points)
export const FITNESS_TIPS: { title: string; tip: string }[] = [
  { title: "Stay Hydrated", tip: "Aim for around 8 glasses of water a day." },
  { title: "Move Daily", tip: "Even a 20-minute walk counts toward your health." },
  { title: "Sleep Well", tip: "Target 7–9 hours of sleep each night." },
  { title: "Eat the Rainbow", tip: "Fill half your plate with fruits and veggies." },
  { title: "Stretch It Out", tip: "Loosen up with a few minutes of stretching." },
];
