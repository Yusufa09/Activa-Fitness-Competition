"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import type { ChallengeWithStatus } from "@/types";

interface Props {
  challenge: ChallengeWithStatus;
  deviceToken: string;
  onClaimed: () => void;
}

export function WeeklyChallengeCard({ challenge, deviceToken, onClaimed }: Props) {
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    const res = await fetch("/api/challenges/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, challenge_id: challenge.id, type: "weekly" }),
    });
    const data = await res.json();
    setClaiming(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not claim challenge.");
      return;
    }
    toast.success(`+${data.points_earned} points! Keep it up!`);
    onClaimed();
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        challenge.completed
          ? "bg-teal-50 border-teal-200"
          : "bg-white border-slate-200 hover:border-teal-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h3 className="font-semibold text-slate-800">{challenge.title}</h3>
          </div>
          {challenge.description && (
            <p className="text-sm text-slate-500 ml-6">{challenge.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-amber-600">+{challenge.points} pts</span>
          {challenge.completed ? (
            <div className="flex items-center gap-1 text-teal-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Done!</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={claiming}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5"
            >
              {claiming ? "Claiming..." : "Claim"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
