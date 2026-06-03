"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession, saveSession } from "@/lib/member-session";
import type { MemberState } from "@/types";

interface SessionResult {
  state: MemberState | null;
  deviceToken: string | null;
  loading: boolean;
  refetch: () => void;
}

export function useMemberSession(): SessionResult {
  const router = useRouter();
  const [state, setState] = useState<MemberState | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      setLoading(false);
      router.replace("/");
      return;
    }

    setDeviceToken(stored.device_token);

    fetch(`/api/member/session?token=${stored.device_token}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MemberState | null) => {
        if (!data) {
          clearSession();
          router.replace("/");
          return;
        }
        saveSession({
          device_token: stored.device_token,
          member_id: data.member.id,
          display_name: data.member.display_name,
          gym_id: data.gym.id,
          gym_name: data.gym.name,
        });
        setState(data);
        setLoading(false);
      })
      .catch(() => {
        clearSession();
        router.replace("/");
      });
  }, [router, tick]);

  return { state, deviceToken, loading, refetch: () => setTick((t) => t + 1) };
}
