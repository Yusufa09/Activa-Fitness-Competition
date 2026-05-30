export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStart, toDateString, ATTENDANCE_BONUS_POINTS } from "@/lib/points";

export async function POST(req: NextRequest) {
  const { device_token, challenge_id, type } = await req.json();

  if (!device_token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Resolve member from token
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, team_id")
    .eq("device_token", device_token)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Session invalid." }, { status: 401 });
  }

  const weekStart = toDateString(getWeekStart());

  // --- Attendance logging ---
  if (type === "attendance") {
    const { data: existing } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("member_id", member.id)
      .eq("week_start", weekStart)
      .single();

    if (existing) {
      if (existing.visit_count >= 3) {
        return NextResponse.json(
          { error: "You've already logged 3 visits this week!" },
          { status: 409 }
        );
      }
      const newCount = existing.visit_count + 1;
      await supabase
        .from("attendance_logs")
        .update({ visit_count: newCount })
        .eq("id", existing.id);

      const pointsEarned = newCount === 3 ? ATTENDANCE_BONUS_POINTS : 0;

      const { data: updatedMember } = await supabase
        .from("members")
        .select("total_points")
        .eq("id", member.id)
        .single();

      return NextResponse.json({
        success: true,
        visit_count: newCount,
        points_earned: pointsEarned,
        new_total: updatedMember?.total_points ?? 0,
      });
    } else {
      await supabase
        .from("attendance_logs")
        .insert({ member_id: member.id, week_start: weekStart, visit_count: 1 });

      return NextResponse.json({ success: true, visit_count: 1, points_earned: 0, new_total: 0 });
    }
  }

  // --- Weekly challenge logging ---
  if (!challenge_id) {
    return NextResponse.json({ error: "challenge_id is required." }, { status: 400 });
  }

  // Verify challenge exists and is active
  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challenge_id)
    .eq("is_active", true)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found or inactive." }, { status: 404 });
  }

  // Check for duplicate claim
  const { data: duplicate } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("member_id", member.id)
    .eq("challenge_id", challenge_id)
    .single();

  if (duplicate) {
    return NextResponse.json({ error: "You already claimed this challenge." }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("activity_logs").insert({
    member_id: member.id,
    challenge_id,
    points_earned: challenge.points,
  });

  if (insertError) {
    // Handle race-condition duplicate insert
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You already claimed this challenge." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not log activity." }, { status: 500 });
  }

  const { data: updatedMember } = await supabase
    .from("members")
    .select("total_points")
    .eq("id", member.id)
    .single();

  return NextResponse.json({
    success: true,
    points_earned: challenge.points,
    new_total: updatedMember?.total_points ?? 0,
  });
}
