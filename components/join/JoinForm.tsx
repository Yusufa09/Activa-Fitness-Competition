"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession } from "@/lib/member-session";
import type { MemberSession } from "@/types";

interface JoinFormProps {
  prefilledCode?: string;
  prefilledTeamName?: string;
}

export function JoinForm({ prefilledCode, prefilledTeamName }: JoinFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState(prefilledCode ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!code.trim()) {
      setError("Please enter your team code.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/member/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name.trim(), join_code: code.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const session: MemberSession = {
      device_token: data.device_token,
      member_id: data.member.id,
      display_name: data.member.display_name,
      team_id: data.member.team_id,
      team_name: data.member.team.name,
      team_color: data.member.team.color,
    };
    saveSession(session);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-700 font-medium">
          Your Name
        </Label>
        <Input
          id="name"
          placeholder="e.g. Jordan Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoComplete="given-name"
          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="text-slate-700 font-medium">
          Team Code
        </Label>
        {prefilledCode && prefilledTeamName ? (
          <div className="flex items-center gap-3 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="font-semibold text-teal-800">{prefilledTeamName}</p>
              <p className="text-sm text-teal-600">Code: {prefilledCode}</p>
            </div>
          </div>
        ) : (
          <Input
            id="code"
            placeholder="e.g. ALPHA"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
            className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 uppercase tracking-widest"
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 text-base"
      >
        {loading ? "Joining..." : "Join Team →"}
      </Button>
    </form>
  );
}
