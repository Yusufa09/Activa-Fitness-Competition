export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { getActiveCompetition } from "@/lib/enrollment";

type Supa = ReturnType<typeof createAdminClient>;

// Confirm a competition belongs to the admin's gym
async function competitionInGym(supabase: Supa, competitionId: string, gymId: string) {
  const { data } = await supabase
    .from("competitions").select("id").eq("id", competitionId).eq("gym_id", gymId).maybeSingle();
  return !!data;
}

// Confirm a goal belongs to a competition in the admin's gym
async function goalInGym(supabase: Supa, goalId: string, gymId: string) {
  const { data } = await supabase
    .from("goals").select("competition:competitions(gym_id)").eq("id", goalId).maybeSingle();
  // @ts-expect-error nested select
  return data?.competition?.gym_id === gymId;
}

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  let competitionId = req.nextUrl.searchParams.get("competition_id");

  if (!competitionId) {
    const active = await getActiveCompetition(supabase, ctx.gymId);
    competitionId = active?.id ?? null;
  } else if (!(await competitionInGym(supabase, competitionId, ctx.gymId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!competitionId) return NextResponse.json({ goals: [], competition_id: null });

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("kind", "standard") // the body_scan goal is managed via competition settings
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data, competition_id: competitionId });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    competition_id, title, description, points, target_count,
    is_refreshable, refresh_interval, starts_at, ends_at, is_active,
  } = body;

  if (!competition_id || !title?.trim()) {
    return NextResponse.json({ error: "Competition and title are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!(await competitionInGym(supabase, competition_id, ctx.gymId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      competition_id,
      title: title.trim(),
      description: description?.trim() || null,
      points: points ?? 100,
      target_count: target_count ?? 1,
      is_refreshable: !!is_refreshable,
      refresh_interval: is_refreshable ? (refresh_interval ?? "daily") : null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  if (!(await goalInGym(supabase, id, ctx.gymId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (updates.is_refreshable === false) updates.refresh_interval = null;
  delete updates.competition_id; // never reassign across competitions

  const { data, error } = await supabase
    .from("goals").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  if (!(await goalInGym(supabase, id, ctx.gymId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
