"use client";

import { motion } from "framer-motion";
import { PointsTicker } from "./PointsTicker";
import { TEAM_COLORS, teamTotal } from "@/lib/points";
import type { LeaderboardTeam } from "@/types";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface Props {
  team: LeaderboardTeam;
  maxPoints: number;
}

export function TeamCard({ team, maxPoints }: Props) {
  const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
  const total = teamTotal(team);
  const barPct = maxPoints > 0 ? Math.max((total / maxPoints) * 100, 2) : 2;
  const medal = RANK_MEDALS[team.rank];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl w-12 text-center">
            {medal ?? <span className="text-2xl text-slate-300 dark:text-slate-600 font-bold">#{team.rank}</span>}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{team.name}</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm">{team.member_count} members</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${colors.text}`}>
            <PointsTicker value={total} />
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">points</p>
        </div>
      </div>

      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </motion.div>
  );
}
