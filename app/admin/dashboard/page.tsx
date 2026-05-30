"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Zap, Crown } from "lucide-react";

interface Stats {
  totalMembers: number;
  totalPoints: number;
  activeChallenges: number;
  topTeam: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/admin/challenges").then((r) => r.json()),
    ]).then(([teamsData, challengesData]) => {
      const teams = teamsData.teams ?? [];
      const challenges = challengesData.challenges ?? [];
      const totalMembers = teams.reduce(
        (sum: number, t: { members?: unknown[] }) => sum + (t.members?.length ?? 0),
        0
      );
      const totalPoints = teams.reduce(
        (sum: number, t: { total_points: number }) => sum + t.total_points,
        0
      );
      const activeChallenges = challenges.filter((c: { is_active: boolean }) => c.is_active).length;
      const topTeam = teams[0]?.name ?? "—";
      setStats({ totalMembers, totalPoints, activeChallenges, topTeam });
      setLoading(false);
    });
  }, []);

  const cards = stats
    ? [
        { label: "Total Members", value: stats.totalMembers, icon: Users, color: "text-teal-600" },
        { label: "Points Awarded", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-amber-600" },
        { label: "Active Challenges", value: stats.activeChallenges, icon: Trophy, color: "text-violet-600" },
        { label: "Leading Team", value: stats.topTeam, icon: Crown, color: "text-sky-600" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-500 text-sm">{label}</p>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-2">Quick Links</h2>
        <div className="flex gap-3 flex-wrap">
          <a href="/leaderboard" target="_blank" className="text-sm text-teal-600 hover:underline">
            Open Leaderboard ↗
          </a>
          <a href="/admin/challenges" className="text-sm text-teal-600 hover:underline">
            Manage Challenges →
          </a>
          <a href="/admin/teams" className="text-sm text-teal-600 hover:underline">
            Manage Teams →
          </a>
        </div>
      </div>
    </div>
  );
}
