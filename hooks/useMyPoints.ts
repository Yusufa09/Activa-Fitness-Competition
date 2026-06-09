"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Reads the member's own points DIRECTLY from the enrollments table via the
 * live Supabase client — the same reliable path the leaderboard uses for team
 * totals. This avoids the stale /api/member/session snapshot, and updates in
 * real time (when the enrollments table is in the realtime publication) plus
 * on-demand via refetch() after the member logs a goal.
 */
export function useMyPoints(enrollmentId: string | null) {
  const [points, setPoints] = useState(0);

  const refetch = useCallback(async () => {
    if (!enrollmentId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("points")
      .eq("id", enrollmentId)
      .single();
    if (data) setPoints(data.points);
  }, [enrollmentId]);

  useEffect(() => {
    if (!enrollmentId) return;
    refetch();

    const supabase = createClient();
    const channel = supabase
      .channel(`my-points-${enrollmentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "enrollments", filter: `id=eq.${enrollmentId}` },
        (payload) => setPoints((payload.new as { points: number }).points)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enrollmentId, refetch]);

  return { points, refetch };
}
