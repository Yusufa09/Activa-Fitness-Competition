export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompetition } from "@/lib/enrollment";
import { getPeriodKey, toDateString } from "@/lib/points";
import type { PersonalGoal, PersonalGoalWithProgress } from "@/types";

type Supa = ReturnType<typeof createAdminClient>;

async function resolveEnrollment(supabase: Supa, token: string | null) {
  if (!token) return { error: "Not signed in.", status: 401 as const };
  const { data: member } = await supabase
    .from("members").select("id, gym_id").eq("device_token", token).single();
  if (!member) return { error: "Session invalid.", status: 401 as const };

  const competition = await getActiveCompetition(supabase, member.gym_id);
  if (!competition) return { error: "No active competition.", status: 409 as const };

  const { data: enrollment } = await supabase
    .from("enrollments").select("id").eq("member_id", member.id).eq("competition_id", competition.id).single();
  if (!enrollment) return { error: "You're not enrolled.", status: 409 as const };

  return { enrollmentId: enrollment.id };
}

// Enrich a raw personal goal with current-period progress + completed + active
function enrich(g: PersonalGoal): PersonalGoalWithProgress {
  const today = toDateString(new Date());
  const currentPeriod = getPeriodKey(g.is_refreshable, g.refresh_interval);
  const progress = g.period_key === currentPeriod ? g.progress_count : 0;
  const active = (!g.starts_at || today >= g.starts_at) && (!g.ends_at || today <= g.ends_at);
  return { ...g, progress, completed: progress >= g.target_count, active };
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, req.nextUrl.searchParams.get("token"));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { data, error } = await supabase
    .from("personal_goals").select("*").eq("enrollment_id", r.enrollmentId).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: (data ?? []).map((g) => enrich(g as PersonalGoal)) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { device_token, title, description, target_count, is_refreshable, refresh_interval, starts_at, ends_at } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Give your goal a title." }, { status: 400 });

  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, device_token);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { data, error } = await supabase
    .from("personal_goals")
    .insert({
      enrollment_id: r.enrollmentId,
      title: title.trim(),
      description: description?.trim() || null,
      target_count: Math.max(1, target_count ?? 1),
      is_refreshable: !!is_refreshable,
      refresh_interval: is_refreshable ? (refresh_interval ?? "daily") : null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: enrich(data as PersonalGoal) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { device_token, id, action } = body;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, device_token);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // Load the goal (and confirm ownership)
  const { data: goal } = await supabase
    .from("personal_goals").select("*").eq("id", id).eq("enrollment_id", r.enrollmentId).single();
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  // --- Log a completion (increment progress for the current period) ---
  if (action === "log") {
    const currentPeriod = getPeriodKey(goal.is_refreshable, goal.refresh_interval);
    let count = goal.period_key === currentPeriod ? goal.progress_count : 0;
    if (count >= goal.target_count) {
      return NextResponse.json({ error: goal.is_refreshable ? "Already done for this period!" : "Already completed!" }, { status: 409 });
    }
    count += 1;
    const { data: updated } = await supabase
      .from("personal_goals").update({ progress_count: count, period_key: currentPeriod }).eq("id", id).select().single();
    return NextResponse.json({ goal: enrich(updated as PersonalGoal) });
  }

  // --- Edit fields ---
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("description" in body) patch.description = body.description?.trim() || null;
  if (typeof body.target_count === "number") patch.target_count = Math.max(1, body.target_count);
  if (typeof body.is_refreshable === "boolean") {
    patch.is_refreshable = body.is_refreshable;
    patch.refresh_interval = body.is_refreshable ? (body.refresh_interval ?? "daily") : null;
  }
  if ("starts_at" in body) patch.starts_at = body.starts_at || null;
  if ("ends_at" in body) patch.ends_at = body.ends_at || null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data: updated, error } = await supabase
    .from("personal_goals").update(patch).eq("id", id).eq("enrollment_id", r.enrollmentId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: enrich(updated as PersonalGoal) });
}

export async function DELETE(req: NextRequest) {
  const { device_token, id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, device_token);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { error } = await supabase
    .from("personal_goals").delete().eq("id", id).eq("enrollment_id", r.enrollmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
