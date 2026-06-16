"use client";

import { useMemberSession } from "@/hooks/useMemberSession";
import { MemberNav } from "@/components/MemberNav";
import { PersonalGoals } from "@/components/dashboard/PersonalGoals";
import { Logo } from "@/components/Logo";

export default function MyGoalsPage() {
  const { state, deviceToken, loading } = useMemberSession();

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Logo className="w-14 h-14 animate-pulse" />
      </div>
    );
  }

  const hasCompetition = !!state.competition && !!state.enrollment;

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pb-12">
      <MemberNav />
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Set your own personal goals for this competition. Only you can see these.</p>
        </div>

        {!hasCompetition ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            There&apos;s no active competition right now, so you can&apos;t set personal goals yet.
          </div>
        ) : (
          deviceToken && <PersonalGoals deviceToken={deviceToken} manage />
        )}
      </div>
    </main>
  );
}
