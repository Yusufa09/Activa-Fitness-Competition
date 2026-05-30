"use client";

import { useEffect, useState } from "react";
import { useMemberSession } from "@/hooks/useMemberSession";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { MemberHeader } from "@/components/dashboard/MemberHeader";
import { WeeklyChallengeCard } from "@/components/dashboard/WeeklyChallengeCard";
import { AttendanceTracker } from "@/components/dashboard/AttendanceTracker";
import { PointsSummary } from "@/components/dashboard/PointsSummary";
import { MiniLeaderboard } from "@/components/dashboard/MiniLeaderboard";
import { clearSession } from "@/lib/member-session";
import { useRouter } from "next/navigation";
import { Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useMemberSession();
  const { challenges, attendance, loading: challengesLoading, refetch } = useWeeklyChallenges(
    session?.member_id ?? null
  );
  const [memberPoints, setMemberPoints] = useState<number>(0);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/member/session?token=${session.device_token}`)
      .then((r) => r.json())
      .then((d) => setMemberPoints(d.member?.total_points ?? 0));
  }, [session, challenges, attendance]);

  function handleSignOut() {
    clearSession();
    router.replace("/");
  }

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <Dumbbell className="w-10 h-10 text-teal-500 animate-pulse" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-slate-800 text-sm">Gym Challenge</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          Leave
        </Button>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <MemberHeader
          displayName={session.display_name}
          teamName={session.team_name}
          teamColor={session.team_color}
          totalPoints={memberPoints}
        />

        <PointsSummary
          challenges={challenges}
          attendance={attendance}
          allTimePoints={memberPoints}
        />

        {/* Weekly Challenges */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
            This Week&apos;s Challenges
          </h2>
          {challengesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
              No challenges this week yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <WeeklyChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  deviceToken={session.device_token}
                  onClaimed={refetch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Attendance */}
        <AttendanceTracker
          attendance={attendance}
          deviceToken={session.device_token}
          onLogged={refetch}
        />

        {/* Mini leaderboard */}
        <MiniLeaderboard />
      </div>
    </main>
  );
}
