"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession, getDeviceToken } from "@/lib/member-session";

export function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/member/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name.trim(), device_token: getDeviceToken() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    saveSession({
      device_token: data.device_token,
      member_id: data.member.id,
      display_name: data.member.display_name,
    });
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
          autoComplete="name"
          className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
        />
        <p className="text-xs text-slate-400">
          You&apos;ll be placed on a team automatically.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base"
      >
        {loading ? "Signing in..." : "Let's Go →"}
      </Button>
    </form>
  );
}
