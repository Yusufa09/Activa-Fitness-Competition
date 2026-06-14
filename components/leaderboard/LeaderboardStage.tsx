"use client";

import { AnimatePresence } from "framer-motion";
import { useMemberSession } from "@/hooks/useMemberSession";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { teamTotal } from "@/lib/points";
import { TeamCard } from "./TeamCard";
import { Logo } from "@/components/Logo";

export function LeaderboardStage() {
  const { state, loading: sessionLoading } = useMemberSession();
  const competitionId = state?.competition?.id ?? null;
  const { teams, loading } = useLeaderboard(competitionId);
  const maxPoints = teams[0] ? teamTotal(teams[0]) : 1;

  const busy = sessionLoading || loading;
  const competition = state?.competition ?? null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white flex flex-col">
      <header className="pt-10 pb-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-2xl px-6 py-3">
          <Logo className="w-8 h-8" />
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {competition ? competition.name : "Leaderboard"}
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-3">
          {competition ? "Updates in real time" : "No active competition"}
        </p>
      </header>

      <main className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full">
        {busy ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !competition ? (
          <div className="text-center text-slate-400 py-20">
            <p className="text-lg">No competition is running right now.</p>
            <p className="text-sm mt-2">Check back when the next one starts!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} maxPoints={maxPoints} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
