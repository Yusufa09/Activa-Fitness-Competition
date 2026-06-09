"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { teamTotal } from "@/lib/points";
import type { LeaderboardTeam } from "@/types";

export function useLeaderboard(competitionId: string | null) {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchTeams() {
      const { data } = await supabase
        .from("teams")
        .select("*, enrollments(count)")
        .eq("competition_id", competitionId);

      if (data) {
        const sorted = [...data].sort((a, b) => teamTotal(b) - teamTotal(a));
        setTeams(
          sorted.map((t, i) => ({
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
      .channel(`leaderboard-${competitionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `competition_id=eq.${competitionId}` },
        (payload) => {
          setTeams((prev) => {
            const updated = prev.map((t) =>
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            );
            const sorted = [...updated].sort((a, b) => teamTotal(b) - teamTotal(a));
            return sorted.map((t, i) => ({ ...t, rank: i + 1 }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId]);

  return { teams, loading };
}
