"use client";

import { useCallback, useEffect, useState } from "react";
import type { PersonalGoalWithProgress } from "@/types";

export interface PersonalGoalInput {
  title: string;
  description?: string;
  target_count?: number;
  is_refreshable?: boolean;
  refresh_interval?: "daily" | "weekly" | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

export function usePersonalGoals(deviceToken: string | null) {
  const [goals, setGoals] = useState<PersonalGoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!deviceToken) { setLoading(false); return; }
    const res = await fetch(`/api/personal-goals?token=${deviceToken}`, { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setGoals(d.goals ?? []);
    }
    setLoading(false);
  }, [deviceToken]);

  useEffect(() => { refetch(); }, [refetch]);

  async function send(method: string, payload: Record<string, unknown>) {
    const res = await fetch("/api/personal-goals", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, ...payload }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "Something went wrong.");
    return d;
  }

  const add = (g: PersonalGoalInput) => send("POST", g).then(refetch);
  const edit = (id: string, g: PersonalGoalInput) => send("PATCH", { id, ...g }).then(refetch);
  const remove = (id: string) => send("DELETE", { id }).then(refetch);
  const log = (id: string) => send("PATCH", { id, action: "log" }).then(refetch);

  return { goals, loading, add, edit, remove, log, refetch };
}
