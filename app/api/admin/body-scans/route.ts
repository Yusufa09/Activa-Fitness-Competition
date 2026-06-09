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
    .select("id, name, color, enrollments(id, member:members(display_name))")
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
    is_winner: competition.body_scan_winner_team_id === t.id,
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
      body_scan_winner_points: competition.body_scan_winner_points,
      body_scan_winner_team_id: competition.body_scan_winner_team_id,
    },
    teams: shaped,
  });
}

// POST { action: 'declare_winner', team_id } — move the winner bonus to that team
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, team_id } = await req.json();
  if (action !== "declare_winner" || !team_id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const competition = await getActiveCompetition(supabase, ctx.gymId);
  if (!competition) return NextResponse.json({ error: "No active competition." }, { status: 409 });

  // The new team must belong to this competition
  if (!(await teamInCompetition(supabase, team_id, competition.id))) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const bonus = competition.body_scan_winner_points ?? 0;
  const prevWinner: string | null = competition.body_scan_winner_team_id;
  if (prevWinner === team_id) return NextResponse.json({ success: true }); // no change

  // Remove bonus from previous winner
  if (prevWinner && bonus > 0) {
    const { data: prev } = await supabase.from("teams").select("bonus_points").eq("id", prevWinner).single();
    if (prev) {
      await supabase.from("teams").update({ bonus_points: Math.max(0, prev.bonus_points - bonus) }).eq("id", prevWinner);
    }
  }
  // Add bonus to new winner
  if (bonus > 0) {
    const { data: nw } = await supabase.from("teams").select("bonus_points").eq("id", team_id).single();
    if (nw) {
      await supabase.from("teams").update({ bonus_points: nw.bonus_points + bonus }).eq("id", team_id);
    }
  }
  // Record the winner
  await supabase.from("competitions").update({ body_scan_winner_team_id: team_id }).eq("id", competition.id);

  return NextResponse.json({ success: true });
}

async function teamInCompetition(supabase: Supa, teamId: string, competitionId: string) {
  const { data } = await supabase
    .from("teams").select("id").eq("id", teamId).eq("competition_id", competitionId).maybeSingle();
  return !!data;
}
