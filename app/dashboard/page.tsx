"use client";

import { useMemberSession } from "@/hooks/useMemberSession";
import { useGoals } from "@/hooks/useGoals";
import { useMyPoints } from "@/hooks/useMyPoints";
import { MemberHeader } from "@/components/dashboard/MemberHeader";
import { CompetitionBanner } from "@/components/dashboard/CompetitionBanner";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { MiniLeaderboard } from "@/components/dashboard/MiniLeaderboard";
import { NoActiveCompetition } from "@/components/dashboard/NoActiveCompetition";
import { MemberNav } from "@/components/MemberNav";
import { Dumbbell } from "lucide-react";

export default function DashboardPage() {
  const { state, deviceToken, loading, refetch } = useMemberSession();

  const competitionId = state?.competition?.id ?? null;
  const enrollmentId = state?.enrollment?.id ?? null;
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals(competitionId, enrollmentId);

  // Read the member's points DIRECTLY from enrollments (live), not from the
  // session snapshot — same reliable path the team leaderboard uses.
  const { points: myPoints, refetch: refetchPoints } = useMyPoints(enrollmentId);

  function handleLogged() {
    refetchPoints();  // re-read my points straight from the DB
    refetchGoals();   // refresh goal progress
    refetch();        // refresh session (team/competition)
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Dumbbell className="w-10 h-10 text-orange-500 animate-pulse" />
      </div>
    );
  }

  const hasCompetition = !!state.competition && !!state.enrollment;

  return (
    <main className="min-h-screen bg-white pb-12">
      <MemberNav />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {!hasCompetition ? (
          <NoActiveCompetition displayName={state.member.display_name} />
        ) : (
          <>
            <MemberHeader
              displayName={state.member.display_name}
              teamName={state.enrollment!.team.name}
              teamColor={state.enrollment!.team.color}
              myPoints={myPoints}
            />

            <CompetitionBanner competition={state.competition!} />

            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
                Goals
              </h2>
              {goalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-200 animate-pulse" />
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
                  No goals yet. Check back soon!
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} deviceToken={deviceToken!} onLogged={handleLogged} />
                  ))}
                </div>
              )}
            </div>

            <MiniLeaderboard competitionId={state.competition!.id} />
          </>
        )}
      </div>
    </main>
  );
}
