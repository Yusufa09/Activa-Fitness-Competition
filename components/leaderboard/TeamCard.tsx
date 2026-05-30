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
  const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.teal;
  const barPct = maxPoints > 0 ? Math.max((team.total_points / maxPoints) * 100, 2) : 2;
  const medal = RANK_MEDALS[team.rank];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl w-12 text-center">
            {medal ?? <span className="text-2xl text-white/50">#{team.rank}</span>}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            <p className="text-white/50 text-sm">{team.member_count} members</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${colors.text} drop-shadow`}>
            <PointsTicker value={team.total_points} />
          </p>
          <p className="text-white/40 text-xs mt-0.5">points</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colors.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
