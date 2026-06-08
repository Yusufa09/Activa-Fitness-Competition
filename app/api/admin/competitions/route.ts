export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { TEAM_COLOR_PALETTE } from "@/lib/points";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*, teams(id, name, color, total_points)")
    .eq("gym_id", ctx.gymId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitions: data });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, start_date, end_date, team_names } = await req.json();

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
    .insert({ gym_id: ctx.gymId, name: name.trim(), start_date, end_date, is_active: true })
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

  return NextResponse.json({ competition });
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

  // Generic field updates (name/dates)
  const { data, error } = await supabase
    .from("competitions")
    .update(updates)
    .eq("id", id)
    .eq("gym_id", ctx.gymId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
