"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardTeam } from "@/types";

export function useLeaderboard() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchTeams() {
      const { data } = await supabase
        .from("teams")
        .select("*, members(count)")
        .order("total_points", { ascending: false });

      if (data) {
        setTeams(
          data.map((t, i) => ({
            ...t,
            rank: i + 1,
            member_count: (t.members as unknown as [{ count: number }])[0]?.count ?? 0,
          }))
        );
      }
      setLoading(false);
    }

    fetchTeams();

    // Real-time subscription on teams table
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

  return { teams, loading };
}
