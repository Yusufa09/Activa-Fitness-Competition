"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardTeam, Competition } from "@/types";

export function useLeaderboard() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchTeams() {
      const { data: comp } = await supabase
        .from("competitions")
        .select("*")
        .eq("is_active", true)
        .single();

      setCompetition(comp ?? null);

      if (!comp) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("teams")
        .select("*, enrollments(count)")
        .eq("competition_id", comp.id)
        .order("total_points", { ascending: false });

      if (data) {
        setTeams(
          data.map((t, i) => ({
            ...t,
            rank: i + 1,
            member_count: (t.enrollments as unknown as [{ count: number }])[0]?.count ?? 0,
          }))
        );
      }
      setLoading(false);
    }

    fetchTeams();

    const channel = supabase
      .channel("leaderboard-teams")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams" },
        (payload) => {
          setTeams((prev) => {
            const updated = prev.map((t) =>
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            );
            const sorted = [...updated].sort((a, b) => b.total_points - a.total_points);
            return sorted.map((t, i) => ({ ...t, rank: i + 1 }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { teams, competition, loading };
}
