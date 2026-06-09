export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompetition } from "@/lib/enrollment";

// Returns the signed-in member's own body scans for the active competition.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members").select("id, gym_id").eq("device_token", token).single();
  if (!member) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  const competition = await getActiveCompetition(supabase, member.gym_id);
  if (!competition) return NextResponse.json({ competition: null, scans: [] });

  const { data: enrollment } = await supabase
    .from("enrollments").select("id").eq("member_id", member.id).eq("competition_id", competition.id).single();

  let scans: unknown[] = [];
  if (enrollment) {
    const { data } = await supabase
      .from("body_scans").select("*").eq("enrollment_id", enrollment.id).order("recorded_at", { ascending: true });
    scans = data ?? [];
  }

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      body_scan_enabled: competition.body_scan_enabled,
      body_scan_metrics: competition.body_scan_metrics,
      body_scan_goal_points: competition.body_scan_goal_points,
    },
    scans,
  });
}
