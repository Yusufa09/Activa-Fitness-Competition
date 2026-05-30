"use client";

import { AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { TeamCard } from "./TeamCard";
import { Dumbbell } from "lucide-react";

export function LeaderboardStage() {
  const { teams, loading } = useLeaderboard();
  const maxPoints = teams[0]?.total_points ?? 1;

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 text-center">
        <div className="inline-flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-3">
          <Dumbbell className="w-7 h-7 text-teal-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">Team Leaderboard</h1>
        </div>
        <p className="text-white/40 text-sm mt-3">Updates in real time</p>
      </header>

      {/* Cards */}
      <main className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
            ))}
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

      {/* Footer */}
      <footer className="pb-6 text-center text-white/20 text-xs">
        <a href="/" className="hover:text-white/40 transition-colors">
          Join your team →
        </a>
      </footer>
    </div>
  );
}
