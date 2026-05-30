"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AttendanceLog } from "@/types";

interface Props {
  attendance: AttendanceLog | null;
  deviceToken: string;
  onLogged: () => void;
}

export function AttendanceTracker({ attendance, deviceToken, onLogged }: Props) {
  const [logging, setLogging] = useState(false);
  const visitCount = attendance?.visit_count ?? 0;

  async function handleLog() {
    setLogging(true);
    const res = await fetch("/api/challenges/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: deviceToken, type: "attendance" }),
    });
    const data = await res.json();
    setLogging(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not log visit.");
      return;
    }

    if (data.visit_count === 3) {
      toast.success("3 visits complete! +100 points earned! 🎉");
    } else {
      toast.success(`Visit ${data.visit_count} logged! ${3 - data.visit_count} more for 100 pts.`);
    }
    onLogged();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Gym Visits This Week</h3>
          <p className="text-xs text-slate-400 mt-0.5">3 visits = 100 points</p>
        </div>
        {visitCount === 3 && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            +100 pts earned!
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 h-3 rounded-full transition-all ${
              n <= visitCount ? "bg-teal-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {visitCount < 3
            ? `${visitCount}/3 visits — ${3 - visitCount} more to earn bonus`
            : "All visits logged this week!"}
        </p>
        <Button
          size="sm"
          onClick={handleLog}
          disabled={logging || visitCount >= 3}
          className={`text-xs ${
            visitCount >= 3
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 text-white"
          }`}
        >
          {logging ? "Logging..." : visitCount >= 3 ? "Complete ✓" : "Log Visit"}
        </Button>
      </div>
    </div>
  );
}
