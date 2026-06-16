"use client";

import { useMemberSession } from "@/hooks/useMemberSession";
import { useGoals } from "@/hooks/useGoals";
import { useMyPoints } from "@/hooks/useMyPoints";
import { MemberHeader } from "@/components/dashboard/MemberHeader";
import { CompetitionBanner } from "@/components/dashboard/CompetitionBanner";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { MiniLeaderboard } from "@/components/dashboard/MiniLeaderboard";
import { NoActiveCompetition } from "@/components/dashboard/NoActiveCompetition";
import { PersonalGoals } from "@/components/dashboard/PersonalGoals";
import { MemberNav } from "@/components/MemberNav";
import { Logo } from "@/components/Logo";

export default function DashboardPage() {
  const { state, deviceToken, loading, refetch } = useMemberSession();

  const competitionId = state?.competition?.id ?? null;
  const enrollmentId = state?.enrollment?.id ?? null;
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals(competitionId, enrollmentId);

  const { points: myPoints, refetch: refetchPoints } = useMyPoints(enrollmentId);

  function handleLogged() {
    refetchPoints();
    refetchGoals();
    refetch();
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Logo className="w-14 h-14 animate-pulse" />
      </div>
    );
  }

  const hasCompetition = !!state.competition && !!state.enrollment;

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pb-12">
      <MemberNav />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {!hasCompetition ? (
          <NoActiveCompetition displayName={state.member.display_name} lastResult={state.last_result} />
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
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-1">
                Challenges
              </h2>
              {goalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No challenges yet. Check back soon!
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} deviceToken={deviceToken!} onLogged={handleLogged} />
                  ))}
                </div>
              )}
            </div>

            <PersonalGoals deviceToken={deviceToken!} />

            <MiniLeaderboard competitionId={state.competition!.id} />
          </>
        )}
      </div>
    </main>
  );
}
