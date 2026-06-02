export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin-auth";

// Returns goals for a given competition (?competition_id=) or the active one
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  let competitionId = req.nextUrl.searchParams.get("competition_id");

  if (!competitionId) {
    const { data: active } = await supabase
      .from("competitions")
      .select("id")
      .eq("is_active", true)
      .single();
    competitionId = active?.id ?? null;
  }

  if (!competitionId) return NextResponse.json({ goals: [], competition_id: null });

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data, competition_id: competitionId });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    competition_id, title, description, points, target_count,
    is_refreshable, refresh_interval, starts_at, ends_at, is_active,
  } = body;

  if (!competition_id || !title?.trim()) {
    return NextResponse.json({ error: "Competition and title are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
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
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  // Normalize refresh_interval when refreshable is off
  if (updates.is_refreshable === false) updates.refresh_interval = null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
