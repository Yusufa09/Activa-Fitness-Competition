import type { RefreshInterval, TeamColor } from "@/types";

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// A team's standings total = points earned from goals + durable bonus (e.g. body-scan winner)
export function teamTotal(t: { total_points: number; bonus_points?: number | null }): number {
  return t.total_points + (t.bonus_points ?? 0);
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
  orange:  { bg: "bg-orange-50 dark:bg-orange-900/30",  text: "text-orange-700 dark:text-orange-300",  border: "border-orange-300 dark:border-orange-700",  bar: "bg-orange-500" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-300 dark:border-rose-700",      bar: "bg-rose-500" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/30",      text: "text-blue-700 dark:text-blue-300",      border: "border-blue-300 dark:border-blue-700",      bar: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", bar: "bg-emerald-500" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-300",  border: "border-violet-300 dark:border-violet-700",  bar: "bg-violet-500" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-900/30",    text: "text-amber-700 dark:text-amber-300",    border: "border-amber-300 dark:border-amber-700",    bar: "bg-amber-500" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-900/30",        text: "text-sky-700 dark:text-sky-300",        border: "border-sky-300 dark:border-sky-700",        bar: "bg-sky-500" },
  teal:    { bg: "bg-teal-50 dark:bg-teal-900/30",      text: "text-teal-700 dark:text-teal-300",      border: "border-teal-300 dark:border-teal-700",      bar: "bg-teal-500" },
};

// Basic fitness tips shown when no competition is active (no points)
export const FITNESS_TIPS: { title: string; tip: string }[] = [
  { title: "Stay Hydrated", tip: "Aim for around 8 glasses of water a day." },
  { title: "Move Daily", tip: "Even a 20-minute walk counts toward your health." },
  { title: "Sleep Well", tip: "Target 7–9 hours of sleep each night." },
  { title: "Eat the Rainbow", tip: "Fill half your plate with fruits and veggies." },
  { title: "Stretch It Out", tip: "Loosen up with a few minutes of stretching." },
];
