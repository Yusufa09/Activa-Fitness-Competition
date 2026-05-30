"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, getWeekEnd, toDateString } from "@/lib/points";
import type { ChallengeWithStatus, AttendanceLog } from "@/types";

export function useWeeklyChallenges(memberId: string | null) {
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!memberId) return;

    const supabase = createClient();
    const weekStart = toDateString(getWeekStart());
    const weekEnd = toDateString(getWeekEnd());

    const [{ data: challenges }, { data: logs }, { data: attendanceLog }] = await Promise.all([
      supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .eq("challenge_type", "weekly")
        .gte("week_start", weekStart)
        .lte("week_end", weekEnd)
        .order("created_at"),
      supabase
        .from("activity_logs")
        .select("challenge_id")
        .eq("member_id", memberId),
      supabase
        .from("attendance_logs")
        .select("*")
        .eq("member_id", memberId)
        .eq("week_start", weekStart)
        .single(),
    ]);

    const completedIds = new Set((logs ?? []).map((l) => l.challenge_id));

    setChallenges(
      (challenges ?? []).map((c) => ({ ...c, completed: completedIds.has(c.id) }))
    );
    setAttendance(attendanceLog ?? null);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { challenges, attendance, loading, refetch: fetchData };
}
