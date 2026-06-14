"use client";

import { useCallback, useEffect, useState } from "react";
import type { PersonalGoal } from "@/types";

export function usePersonalGoals(deviceToken: string | null) {
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
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

  async function add(title: string, description: string) {
    const res = await fetch("/api/personal-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, title, description }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Could not add goal.");
    await refetch();
  }

  async function update(id: string, updates: Partial<{ title: string; description: string; completed: boolean }>) {
    const res = await fetch("/api/personal-goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, id, ...updates }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Could not update goal.");
    await refetch();
  }

  async function remove(id: string) {
    const res = await fetch("/api/personal-goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, id }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Could not delete goal.");
    }
    await refetch();
  }

  return { goals, loading, add, update, remove, refetch };
}
