export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompetition } from "@/lib/enrollment";

export async function POST(req: NextRequest) {
  const { device_token, body_fat, muscle_mass, weight } = await req.json();
  if (!device_token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // At least one value provided
  const vals = { body_fat, muscle_mass, weight };
  const provided = Object.values(vals).some((v) => v !== null && v !== undefined && v !== "");
  if (!provided) return NextResponse.json({ error: "Enter at least one value." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members").select("id, gym_id").eq("device_token", device_token).single();
  if (!member) return NextResponse.json({ error: "Session invalid." }, { status: 401 });

  const competition = await getActiveCompetition(supabase, member.gym_id);
  if (!competition || !competition.body_scan_enabled) {
    return NextResponse.json({ error: "Body scan isn't active." }, { status: 409 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments").select("id").eq("member_id", member.id).eq("competition_id", competition.id).single();
  if (!enrollment) return NextResponse.json({ error: "You're not enrolled." }, { status: 409 });

  // Only store metrics the competition tracks
  const metrics: string[] = competition.body_scan_metrics ?? [];
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const row = {
    enrollment_id: enrollment.id,
    body_fat: metrics.includes("body_fat") ? num(body_fat) : null,
    muscle_mass: metrics.includes("muscle_mass") ? num(muscle_mass) : null,
    weight: metrics.includes("weight") ? num(weight) : null,
  };

  // Is this the member's first scan? (award the one-time goal points)
  const { count: priorCount } = await supabase
    .from("body_scans").select("id", { count: "exact", head: true }).eq("enrollment_id", enrollment.id);

  const { error: insertErr } = await supabase.from("body_scans").insert(row);
  if (insertErr) return NextResponse.json({ error: "Could not save your scan." }, { status: 500 });

  let pointsEarned = 0;
  if ((priorCount ?? 0) === 0) {
    // Complete the auto body_scan goal once → trigger awards points
    const { data: goal } = await supabase
      .from("goals").select("id, points").eq("competition_id", competition.id)
      .eq("kind", "body_scan").eq("is_active", true).maybeSingle();
    if (goal && goal.points > 0) {
      const { error: logErr } = await supabase.from("goal_logs").upsert(
        { enrollment_id: enrollment.id, goal_id: goal.id, period_key: "once", count: 1, points_earned: goal.points },
        { onConflict: "enrollment_id,goal_id,period_key" }
      );
      if (!logErr) pointsEarned = goal.points;
    }
  }

  // Return the member's full scan list (ordered)
  const { data: scans } = await supabase
    .from("body_scans").select("*").eq("enrollment_id", enrollment.id).order("recorded_at", { ascending: true });

  return NextResponse.json({ success: true, points_earned: pointsEarned, scans: scans ?? [] });
}
