export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompetition } from "@/lib/enrollment";
import { getPeriodKey, toDateString } from "@/lib/points";

export async function POST(req: NextRequest) {
  const { device_token, goal_id } = await req.json();

  if (!device_token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!goal_id) {
    return NextResponse.json({ error: "goal_id is required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const competition = await getActiveCompetition(supabase);
  if (!competition) {
    return NextResponse.json({ error: "No active competition." }, { status: 409 });
  }

  // Resolve member → enrollment in active competition
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("device_token", device_token)
    .single();
  if (!member) return NextResponse.json({ error: "Session invalid." }, { status: 401 });

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, team_id, points")
    .eq("member_id", member.id)
    .eq("competition_id", competition.id)
    .single();
  if (!enrollment) {
    return NextResponse.json({ error: "You're not enrolled in this competition." }, { status: 409 });
  }

  // Resolve goal + validate active and within date window
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goal_id)
    .eq("competition_id", competition.id)
    .eq("is_active", true)
    .single();
  if (!goal) return NextResponse.json({ error: "Goal not found or inactive." }, { status: 404 });

  const today = toDateString(new Date());
  if (goal.starts_at && today < goal.starts_at) {
    return NextResponse.json({ error: "This goal hasn't started yet." }, { status: 409 });
  }
  if (goal.ends_at && today > goal.ends_at) {
    return NextResponse.json({ error: "This goal has ended." }, { status: 409 });
  }

  const periodKey = getPeriodKey(goal.is_refreshable, goal.refresh_interval);

  // Find or create the progress row for this period
  const { data: existingLog } = await supabase
    .from("goal_logs")
    .select("*")
    .eq("enrollment_id", enrollment.id)
    .eq("goal_id", goal.id)
    .eq("period_key", periodKey)
    .single();

  const currentCount = existingLog?.count ?? 0;

  if (currentCount >= goal.target_count) {
    return NextResponse.json(
      { error: goal.is_refreshable ? "Already done for this period!" : "Already completed!" },
      { status: 409 }
    );
  }

  const newCount = currentCount + 1;
  const justCompleted = newCount >= goal.target_count;
  const pointsToAward = justCompleted ? goal.points : 0;

  // Upsert progress
  if (existingLog) {
    await supabase
      .from("goal_logs")
      .update({
        count: newCount,
        points_earned: existingLog.points_earned + pointsToAward,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingLog.id);
  } else {
    await supabase.from("goal_logs").insert({
      enrollment_id: enrollment.id,
      goal_id: goal.id,
      period_key: periodKey,
      count: newCount,
      points_earned: pointsToAward,
    });
  }

  // Award points to enrollment + team (team update drives the real-time leaderboard)
  if (pointsToAward > 0) {
    await supabase
      .from("enrollments")
      .update({ points: enrollment.points + pointsToAward })
      .eq("id", enrollment.id);

    const { data: team } = await supabase
      .from("teams")
      .select("total_points")
      .eq("id", enrollment.team_id)
      .single();

    if (team) {
      await supabase
        .from("teams")
        .update({ total_points: team.total_points + pointsToAward })
        .eq("id", enrollment.team_id);
    }
  }

  return NextResponse.json({
    success: true,
    progress: newCount,
    target: goal.target_count,
    completed: justCompleted,
    points_earned: pointsToAward,
  });
}
