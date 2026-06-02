"use client";

import { motion } from "framer-motion";
import { PointsTicker } from "./PointsTicker";
import { TEAM_COLORS } from "@/lib/points";
import type { LeaderboardTeam } from "@/types";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface Props {
  team: LeaderboardTeam;
  maxPoints: number;
}

export function TeamCard({ team, maxPoints }: Props) {
  const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
  const barPct = maxPoints > 0 ? Math.max((team.total_points / maxPoints) * 100, 2) : 2;
  const medal = RANK_MEDALS[team.rank];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl w-12 text-center">
            {medal ?? <span className="text-2xl text-slate-300 font-bold">#{team.rank}</span>}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{team.name}</h2>
            <p className="text-slate-400 text-sm">{team.member_count} members</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${colors.text}`}>
            <PointsTicker value={team.total_points} />
          </p>
          <p className="text-slate-400 text-xs mt-0.5">points</p>
        </div>
      </div>

      {/* Progress bar — plain CSS transition for reliable rendering on every team */}
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </motion.div>
  );
}
