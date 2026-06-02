"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Zap, Crown } from "lucide-react";

interface Stats {
  competitionName: string;
  totalMembers: number;
  totalPoints: number;
  activeGoals: number;
  topTeam: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [noCompetition, setNoCompetition] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/admin/goals").then((r) => r.json()),
    ]).then(([teamsData, goalsData]) => {
      if (!teamsData.competition) {
        setNoCompetition(true);
        setLoading(false);
        return;
      }
      const teams = teamsData.teams ?? [];
      const goals = goalsData.goals ?? [];
      const totalMembers = teams.reduce((s: number, t: { enrollments?: unknown[] }) => s + (t.enrollments?.length ?? 0), 0);
      const totalPoints = teams.reduce((s: number, t: { total_points: number }) => s + t.total_points, 0);
      const activeGoals = goals.filter((g: { is_active: boolean }) => g.is_active).length;
      setStats({
        competitionName: teamsData.competition.name,
        totalMembers,
        totalPoints,
        activeGoals,
        topTeam: teams[0]?.name ?? "—",
      });
      setLoading(false);
    });
  }, []);

  if (noCompetition) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-4">No competition is running right now.</p>
          <a href="/admin/competitions" className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Start a Competition →
          </a>
        </div>
      </div>
    );
  }

  const cards = stats
    ? [
        { label: "Members", value: stats.totalMembers, icon: Users, color: "text-orange-600" },
        { label: "Points Awarded", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-amber-600" },
        { label: "Active Goals", value: stats.activeGoals, icon: Trophy, color: "text-violet-600" },
        { label: "Leading Team", value: stats.topTeam, icon: Crown, color: "text-blue-600" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        {stats && <p className="text-slate-500 text-sm mt-0.5">{stats.competitionName}</p>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
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
          <a href="/leaderboard" target="_blank" className="text-sm text-orange-600 hover:underline">Open Leaderboard ↗</a>
          <a href="/admin/goals" className="text-sm text-orange-600 hover:underline">Manage Goals →</a>
          <a href="/admin/teams" className="text-sm text-orange-600 hover:underline">View Teams →</a>
        </div>
      </div>
    </div>
  );
}
