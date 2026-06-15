"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Zap, Crown } from "lucide-react";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { teamTotal } from "@/lib/points";

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
  const [gym, setGym] = useState<{ name: string; gym_code: string } | null>(null);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    // Use the current site's domain so the QR always points to the real URL
    setAppUrl(window.location.origin);
    Promise.all([
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/admin/goals").then((r) => r.json()),
    ]).then(([teamsData, goalsData]) => {
      if (teamsData.gym) setGym(teamsData.gym);
      if (teamsData.competition) {
        const teams = (teamsData.teams ?? []) as { name: string; total_points: number; bonus_points?: number; enrollments?: unknown[] }[];
        const goals = goalsData.goals ?? [];
        const totalMembers = teams.reduce((s: number, t) => s + (t.enrollments?.length ?? 0), 0);
        const totalPoints = teams.reduce((s: number, t) => s + teamTotal(t), 0);
        const activeGoals = goals.filter((g: { is_active: boolean }) => g.is_active).length;
        const leader = [...teams].sort((a, b) => teamTotal(b) - teamTotal(a))[0];
        setStats({
          competitionName: teamsData.competition.name,
          totalMembers, totalPoints, activeGoals,
          topTeam: leader?.name ?? "—",
        });
      }
      setLoading(false);
    });
  }, []);

  const cards = stats
    ? [
        { label: "Members", value: stats.totalMembers, icon: Users, color: "text-orange-600" },
        { label: "Points Awarded", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-amber-600" },
        { label: "Active Challenges", value: stats.activeGoals, icon: Trophy, color: "text-violet-600" },
        { label: "Leading Team", value: stats.topTeam, icon: Crown, color: "text-blue-600" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        {stats && <p className="text-slate-500 text-sm mt-0.5">{stats.competitionName}</p>}
      </div>

      {/* Members Join card — always visible so you can share the code/QR anytime */}
      {gym && appUrl && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-semibold text-slate-800 mb-1">Invite Members</h2>
          <p className="text-slate-500 text-sm mb-4">Share this code or QR so members can join {gym.name}.</p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 text-center">
              <p className="text-xs uppercase text-orange-600 font-medium tracking-wide">Gym Code</p>
              <p className="text-3xl font-black text-orange-700 tracking-widest mt-1">{gym.gym_code}</p>
            </div>
            <QRCodeDisplay url={`${appUrl}/join/${gym.gym_code}`} label={`Scan to join · Code ${gym.gym_code}`} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : !stats ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-4">No competition is running right now.</p>
          <a href="/admin/competitions" className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Start a Competition →
          </a>
        </div>
      ) : (
        <>
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

          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 mb-2">Quick Links</h2>
            <div className="flex gap-3 flex-wrap">
              <a href="/leaderboard" target="_blank" className="text-sm text-orange-600 hover:underline">Open Leaderboard ↗</a>
              <a href="/admin/goals" className="text-sm text-orange-600 hover:underline">Manage Challenges →</a>
              <a href="/admin/teams" className="text-sm text-orange-600 hover:underline">View Teams →</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
