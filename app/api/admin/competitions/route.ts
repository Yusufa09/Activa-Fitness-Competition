export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { endExpiredCompetitions } from "@/lib/enrollment";
import { TEAM_COLOR_PALETTE, toDateString } from "@/lib/points";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  await endExpiredCompetitions(supabase, ctx.gymId);
  const { data, error } = await supabase
    .from("competitions")
    .select("*, teams(id, name, color, total_points, bonus_points)")
    .eq("gym_id", ctx.gymId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitions: data });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    name, start_date, end_date, team_names,
    body_scan_enabled, body_scan_metrics, body_scan_goal_points, body_scan_winner_points,
  } = await req.json();

  if (!name?.trim() || !start_date || !end_date) {
    return NextResponse.json({ error: "Name and dates are required." }, { status: 400 });
  }
  const teams: string[] = (team_names ?? []).map((t: string) => t.trim()).filter(Boolean);
  if (teams.length < 2) {
    return NextResponse.json({ error: "Add at least 2 team names." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Only one active competition per gym — block if one is already running
  const { data: active } = await supabase
    .from("competitions")
    .select("id")
    .eq("gym_id", ctx.gymId)
    .eq("is_active", true)
    .maybeSingle();
  if (active) {
    return NextResponse.json(
      { error: "End your current competition before starting a new one." },
      { status: 409 }
    );
  }

  const { data: competition, error } = await supabase
    .from("competitions")
    .insert({
      gym_id: ctx.gymId, name: name.trim(), start_date, end_date, is_active: true,
      body_scan_enabled: !!body_scan_enabled,
      body_scan_metrics: body_scan_enabled ? (body_scan_metrics ?? []) : [],
      body_scan_goal_points: body_scan_enabled ? (body_scan_goal_points ?? 0) : 0,
      body_scan_winner_points: body_scan_enabled ? (body_scan_winner_points ?? 0) : 0,
    })
    .select()
    .single();

  if (error || !competition) {
    return NextResponse.json({ error: error?.message ?? "Could not create." }, { status: 500 });
  }

  // Create teams with distinct palette colors
  const teamRows = teams.map((teamName, i) => ({
    competition_id: competition.id,
    name: teamName,
    color: TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length],
  }));
  await supabase.from("teams").insert(teamRows);

  if (body_scan_enabled) {
    await syncBodyScanGoal(supabase, competition.id, true, body_scan_goal_points ?? 0);
  }

  return NextResponse.json({ competition });
}

// Ensure the auto "Complete a Body Scan" goal matches the competition's settings.
async function syncBodyScanGoal(
  supabase: ReturnType<typeof createAdminClient>,
  competitionId: string,
  enabled: boolean,
  points: number
) {
  const { data: existing } = await supabase
    .from("goals")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("kind", "body_scan")
    .maybeSingle();

  if (!enabled) {
    if (existing) await supabase.from("goals").update({ is_active: false }).eq("id", existing.id);
    return;
  }

  if (existing) {
    await supabase.from("goals").update({ points: Math.max(0, points), is_active: true }).eq("id", existing.id);
  } else {
    await supabase.from("goals").insert({
      competition_id: competitionId,
      title: "Complete a Body Scan",
      description: "Submit your first body scan to earn points.",
      points: Math.max(0, points),
      target_count: 1,
      is_refreshable: false,
      kind: "body_scan",
      is_active: true,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();

  // Activating: only allowed if no other competition is currently active
  if (action === "activate") {
    const { data: active } = await supabase
      .from("competitions")
      .select("id")
      .eq("gym_id", ctx.gymId)
      .eq("is_active", true)
      .neq("id", id)
      .maybeSingle();
    if (active) {
      return NextResponse.json(
        { error: "End your current competition before starting another one." },
        { status: 409 }
      );
    }

    // Guard: don't let a competition with an already-expired end_date be
    // activated — endExpiredCompetitions would immediately deactivate it again.
    const { data: target } = await supabase
      .from("competitions")
      .select("end_date")
      .eq("id", id)
      .eq("gym_id", ctx.gymId)
      .single();
    if (target && target.end_date < toDateString(new Date())) {
      return NextResponse.json(
        { error: "This competition's end date has already passed. Update the dates before starting it." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("competitions")
      .update({ is_active: true })
      .eq("id", id)
      .eq("gym_id", ctx.gymId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ competition: data });
  }

  if (action === "end") {
    const { data, error } = await supabase
      .from("competitions")
      .update({ is_active: false })
      .eq("id", id)
      .eq("gym_id", ctx.gymId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ competition: data });
  }

  // Generic field updates (name/dates/body-scan settings)
  const { data, error } = await supabase
    .from("competitions")
    .update(updates)
    .eq("id", id)
    .eq("gym_id", ctx.gymId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the auto body-scan goal in sync when body-scan settings change
  if ("body_scan_enabled" in updates) {
    await syncBodyScanGoal(supabase, id, !!updates.body_scan_enabled, updates.body_scan_goal_points ?? 0);
  }

  return NextResponse.json({ competition: data });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("competitions").delete().eq("id", id).eq("gym_id", ctx.gymId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
