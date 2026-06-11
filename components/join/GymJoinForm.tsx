"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession } from "@/lib/member-session";
import type { MemberState } from "@/types";

// Gym-specific join form (reached via the gym's QR code). The gym is already
// known from the URL, so we only ask for a username + password — no gym code.
export function GymJoinForm({ gymCode }: { gymCode: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter a username."); return; }
    if (!password) { setError("Please create a password."); return; }

    setLoading(true);
    const res = await fetch("/api/member/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name.trim(), password, gym_code: gymCode }),
    });
    const data: { state: MemberState; device_token: string; error?: string } = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    saveSession({
      device_token: data.device_token,
      member_id: data.state.member.id,
      display_name: data.state.member.display_name,
      gym_id: data.state.gym.id,
      gym_name: data.state.gym.name,
      body_scan_enabled: !!data.state.competition?.body_scan_enabled,
    });
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-700 font-medium">Username</Label>
        <Input
          id="name"
          placeholder="e.g. Jordan Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoComplete="username"
          className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="new-password"
          className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
        />
        <p className="text-xs text-slate-400">You&apos;ll use this username and password to log in next time.</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base">
        {loading ? "Joining..." : "Join →"}
      </Button>
    </form>
  );
}
