"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession, saveSession } from "@/lib/member-session";
import type { MemberSession } from "@/types";

export function useMemberSession() {
  const router = useRouter();
  const [session, setSession] = useState<MemberSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      setLoading(false);
      router.replace("/");
      return;
    }

    // Validate token is still valid on the server
    fetch(`/api/member/session?token=${stored.device_token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          clearSession();
          router.replace("/");
          return;
        }
        const { member } = data;
        const updated: MemberSession = {
          device_token: stored.device_token,
          member_id: member.id,
          display_name: member.display_name,
          team_id: member.team_id,
          team_name: member.team.name,
          team_color: member.team.color,
        };
        saveSession(updated);
        setSession(updated);
        setLoading(false);
      })
      .catch(() => {
        clearSession();
        router.replace("/");
      });
  }, [router]);

  return { session, loading };
}
