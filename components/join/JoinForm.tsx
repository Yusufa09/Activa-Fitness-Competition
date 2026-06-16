"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession } from "@/lib/member-session";
import type { MemberState } from "@/types";

interface JoinFormProps {
  prefilledGymCode?: string;
}

export function JoinForm({ prefilledGymCode }: JoinFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"returning" | "first">(prefilledGymCode ? "first" : "returning");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gymCode, setGymCode] = useState(prefilledGymCode ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function finish(data: { state: MemberState; device_token: string }) {
    saveSession({
      device_token: data.device_token,
      member_id: data.state.member.id,
      display_name: data.state.member.display_name,
      gym_id: data.state.gym.id,
      gym_name: data.state.gym.name,
    });
    router.push("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!password) { setError("Please enter your password."); return; }
    if (mode === "first" && !gymCode.trim()) { setError("Please enter your gym code."); return; }

    setLoading(true);

    const endpoint = mode === "first" ? "/api/member/register" : "/api/member/login";
    const body = mode === "first"
      ? { display_name: name.trim(), password, gym_code: gymCode.trim() }
      : { display_name: name.trim(), password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    finish(data);
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-2 mb-5 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setMode("returning"); setError(""); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            mode === "returning"
              ? "bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Returning
        </button>
        <button
          type="button"
          onClick={() => { setMode("first"); setError(""); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            mode === "first"
              ? "bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          First time
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 dark:text-slate-200 font-medium">Your Name</Label>
          <Input
            id="name"
            placeholder="e.g. Jordan Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoComplete="name"
            className="border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder={mode === "first" ? "Create a password" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        {mode === "first" && (
          <div className="space-y-2">
            <Label htmlFor="gym" className="text-slate-700 dark:text-slate-200 font-medium">Gym Code</Label>
            <Input
              id="gym"
              placeholder="e.g. OTF4K2"
              value={gymCode}
              onChange={(e) => setGymCode(e.target.value.toUpperCase())}
              disabled={loading || !!prefilledGymCode}
              className="border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500 uppercase tracking-widest"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">Ask your gym for the code, or scan their QR code.</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base"
        >
          {loading ? "Please wait..." : mode === "first" ? "Create Account →" : "Log In →"}
        </Button>
      </form>
    </div>
  );
}
