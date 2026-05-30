import { MAX_WEEKLY_POINTS, POINTS_PER_CHALLENGE, WEEKLY_CHALLENGE_COUNT, ATTENDANCE_BONUS_POINTS } from "@/lib/points";
import type { ChallengeWithStatus, AttendanceLog } from "@/types";

interface Props {
  challenges: ChallengeWithStatus[];
  attendance: AttendanceLog | null;
  allTimePoints: number;
}

export function PointsSummary({ challenges, attendance, allTimePoints }: Props) {
  const challengePts = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.points, 0);
  const attendancePts = (attendance?.visit_count ?? 0) >= 3 ? ATTENDANCE_BONUS_POINTS : 0;
  const weeklyPts = challengePts + attendancePts;
  const pct = Math.round((weeklyPts / MAX_WEEKLY_POINTS) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">This Week&apos;s Points</h3>
        <span className="text-xl font-bold text-teal-700">
          {weeklyPts} <span className="text-sm text-slate-400 font-normal">/ {MAX_WEEKLY_POINTS}</span>
        </span>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-slate-400 text-xs">Challenges</p>
          <p className="font-bold text-slate-700 mt-0.5">
            {challengePts} / {POINTS_PER_CHALLENGE * WEEKLY_CHALLENGE_COUNT} pts
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-slate-400 text-xs">Gym Bonus</p>
          <p className="font-bold text-slate-700 mt-0.5">
            {attendancePts} / {ATTENDANCE_BONUS_POINTS} pts
          </p>
        </div>
        <div className="col-span-2 bg-amber-50 rounded-lg p-3 border border-amber-100">
          <p className="text-amber-600 text-xs">All-Time Total</p>
          <p className="font-bold text-amber-700 text-lg mt-0.5">{allTimePoints} pts</p>
        </div>
      </div>
    </div>
  );
}
