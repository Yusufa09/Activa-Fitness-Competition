export const POINTS_PER_CHALLENGE = 100;
export const WEEKLY_CHALLENGE_COUNT = 3;
export const ATTENDANCE_VISITS_REQUIRED = 3;
export const ATTENDANCE_BONUS_POINTS = 100;
export const MAX_WEEKLY_POINTS =
  POINTS_PER_CHALLENGE * WEEKLY_CHALLENGE_COUNT + ATTENDANCE_BONUS_POINTS; // 400

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-based week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-300",
    bar: "bg-teal-500",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-300",
    bar: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    bar: "bg-amber-500",
  },
  sky: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-300",
    bar: "bg-sky-500",
  },
};
