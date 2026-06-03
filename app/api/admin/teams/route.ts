export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { getActiveCompetition } from "@/lib/enrollment";
import { TEAM_COLOR_PALETTE } from "@/lib/points";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: gym } = await supabase.from("gyms").select("name, gym_code").eq("id", ctx.gymId).single();
  const competition = await getActiveCompetition(supabase, ctx.gymId);

  if (!competition) return NextResponse.json({ competition: null, teams: [], gym });

  const { data, error } = await supabase
    .from("teams")
    .select("*, enrollments(id, points, member:members(display_name, created_at))")
    .eq("competition_id", competition.id)
    .order("total_points", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competition, teams: data, gym });
}

// Create a new team in the gym's active competition
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Team name is required." }, { status: 400 });

  const supabase = createAdminClient();
  const competition = await getActiveCompetition(supabase, ctx.gymId);
  if (!competition) return NextResponse.json({ error: "No active competition." }, { status: 409 });

  const { count } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", competition.id);
  const color = TEAM_COLOR_PALETTE[(count ?? 0) % TEAM_COLOR_PALETTE.length];

  const { data, error } = await supabase
    .from("teams")
    .insert({ competition_id: competition.id, name: name.trim(), color })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}

// Rename a team, move a member, or reset a member's password
export async function PATCH(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createAdminClient();
  const competition = await getActiveCompetition(supabase, ctx.gymId);
  if (!competition) return NextResponse.json({ error: "No active competition." }, { status: 409 });

  // Verify a team belongs to this gym's active competition
  async function teamInGym(teamId: string) {
    const { data } = await supabase
      .from("teams").select("id").eq("id", teamId).eq("competition_id", competition!.id).maybeSingle();
    return !!data;
  }

  // --- Move a member to another team ---
  if (body.action === "move_member") {
    const { enrollment_id, to_team_id } = body;
    if (!enrollment_id || !to_team_id) {
      return NextResponse.json({ error: "enrollment_id and to_team_id are required." }, { status: 400 });
    }
    if (!(await teamInGym(to_team_id))) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const { data: enrollment } = await supabase
      .from("enrollments").select("id, team_id, points, competition_id").eq("id", enrollment_id).single();
    if (!enrollment || enrollment.competition_id !== competition.id) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }
    if (enrollment.team_id === to_team_id) return NextResponse.json({ success: true });

    await supabase.from("enrollments").update({ team_id: to_team_id }).eq("id", enrollment_id);

    if (enrollment.points !== 0) {
      const [{ data: oldTeam }, { data: newTeam }] = await Promise.all([
        supabase.from("teams").select("total_points").eq("id", enrollment.team_id).single(),
        supabase.from("teams").select("total_points").eq("id", to_team_id).single(),
      ]);
      if (oldTeam) {
        await supabase.from("teams").update({ total_points: oldTeam.total_points - enrollment.points }).eq("id", enrollment.team_id);
      }
      if (newTeam) {
        await supabase.from("teams").update({ total_points: newTeam.total_points + enrollment.points }).eq("id", to_team_id);
      }
    }
    return NextResponse.json({ success: true });
  }

  // --- Rename a team ---
  const { id, name } = body;
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "id and name are required." }, { status: 400 });
  }
  if (!(await teamInGym(id))) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("teams").update({ name: name.trim() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}
