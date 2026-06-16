"use client";

import { useMemberSession } from "@/hooks/useMemberSession";
import { MemberNav } from "@/components/MemberNav";
import { BodyScanPanel } from "@/components/dashboard/BodyScanPanel";
import { Logo } from "@/components/Logo";

export default function BodyScanPage() {
  const { state, deviceToken, loading } = useMemberSession();

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Logo className="w-14 h-14 animate-pulse" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pb-12">
      <MemberNav />
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Body Scan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Track your body composition over the competition.</p>
        </div>
        {deviceToken && <BodyScanPanel deviceToken={deviceToken} />}
      </div>
    </main>
  );
}
