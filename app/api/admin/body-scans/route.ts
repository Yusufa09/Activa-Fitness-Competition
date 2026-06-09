export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { getActiveCompetition } from "@/lib/enrollment";

type Supa = ReturnType<typeof createAdminClient>;

// GET: per-team list of members with their first & latest body scan + deltas
export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const competition = await getActiveCompetition(supabase, ctx.gymId);
  if (!competition) return NextResponse.json({ competition: null, teams: [] });

  // Teams + their enrollments + member name
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color, bonus_points, enrollments(id, member:members(display_name))")
    .eq("competition_id", competition.id)
    .order("name");

  // All scans for this competition's enrollments
  const enrollmentIds: string[] = (teams ?? []).flatMap((t) =>
    (t.enrollments as unknown as { id: string }[]).map((e) => e.id)
  );

  const scansByEnrollment: Record<string, { body_fat: number | null; muscle_mass: number | null; weight: number | null; recorded_at: string }[]> = {};
  if (enrollmentIds.length > 0) {
    const { data: scans } = await supabase
      .from("body_scans")
      .select("enrollment_id, body_fat, muscle_mass, weight, recorded_at")
      .in("enrollment_id", enrollmentIds)
      .order("recorded_at", { ascending: true });
    for (const s of scans ?? []) {
      (scansByEnrollment[s.enrollment_id] ??= []).push(s);
    }
  }

  const shaped = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    bonus_points: t.bonus_points ?? 0,
    members: (t.enrollments as unknown as { id: string; member: { display_name: string } }[]).map((e) => {
      const list = scansByEnrollment[e.id] ?? [];
      const first = list[0] ?? null;
      const latest = list.length > 1 ? list[list.length - 1] : null;
      return { enrollment_id: e.id, display_name: e.member.display_name, first, latest, scan_count: list.length };
    }),
  }));

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      body_scan_enabled: competition.body_scan_enabled,
      body_scan_metrics: competition.body_scan_metrics,
    },
    teams: shaped,
  });
}

// POST { action: 'set_bonus', team_id, points } — set a team's body-scan bonus points
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, team_id, points } = await req.json();
  if (action !== "set_bonus" || !team_id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const competition = await getActiveCompetition(supabase, ctx.gymId);
  if (!competition) return NextResponse.json({ error: "No active competition." }, { status: 409 });

  if (!(await teamInCompetition(supabase, team_id, competition.id))) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const value = Math.max(0, Math.round(Number(points) || 0));
  const { error } = await supabase.from("teams").update({ bonus_points: value }).eq("id", team_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, bonus_points: value });
}

async function teamInCompetition(supabase: Supa, teamId: string, competitionId: string) {
  const { data } = await supabase
    .from("teams").select("id").eq("id", teamId).eq("competition_id", competitionId).maybeSingle();
  return !!data;
}
