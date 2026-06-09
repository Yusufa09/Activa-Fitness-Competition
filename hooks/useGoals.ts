"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPeriodKey, toDateString } from "@/lib/points";
import type { GoalWithProgress } from "@/types";

export function useGoals(competitionId: string | null, enrollmentId: string | null) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!competitionId || !enrollmentId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const today = toDateString(new Date());

    const [{ data: goalRows }, { data: logRows }] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .eq("competition_id", competitionId)
        .eq("is_active", true)
        .eq("kind", "standard") // body_scan goals are handled on the Body Scan page
        .order("created_at"),
      supabase
        .from("goal_logs")
        .select("goal_id, period_key, count")
        .eq("enrollment_id", enrollmentId),
    ]);

    const logs = logRows ?? [];

    const enriched: GoalWithProgress[] = (goalRows ?? [])
      .filter((g) => (!g.starts_at || today >= g.starts_at) && (!g.ends_at || today <= g.ends_at))
      .map((g) => {
        const periodKey = getPeriodKey(g.is_refreshable, g.refresh_interval);
        const log = logs.find((l) => l.goal_id === g.id && l.period_key === periodKey);
        const progress = log?.count ?? 0;
        return { ...g, progress, completed: progress >= g.target_count };
      });

    setGoals(enriched);
    setLoading(false);
  }, [competitionId, enrollmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { goals, loading, refetch: fetchData };
}
