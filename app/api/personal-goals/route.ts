export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompetition } from "@/lib/enrollment";

type Supa = ReturnType<typeof createAdminClient>;

// Resolve the signed-in member's enrollment in their gym's active competition.
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

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, req.nextUrl.searchParams.get("token"));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { data, error } = await supabase
    .from("personal_goals")
    .select("*")
    .eq("enrollment_id", r.enrollmentId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { device_token, title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Give your goal a title." }, { status: 400 });

  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, device_token);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { data, error } = await supabase
    .from("personal_goals")
    .insert({ enrollment_id: r.enrollmentId, title: title.trim(), description: description?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function PATCH(req: NextRequest) {
  const { device_token, id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const r = await resolveEnrollment(supabase, device_token);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // Only allow editing the member's own goals; whitelist updatable fields
  const patch: Record<string, unknown> = {};
  if (typeof updates.title === "string") patch.title = updates.title.trim();
  if ("description" in updates) patch.description = updates.description?.trim() || null;
  if (typeof updates.completed === "boolean") patch.completed = updates.completed;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data, error } = await supabase
    .from("personal_goals")
    .update(patch)
    .eq("id", id)
    .eq("enrollment_id", r.enrollmentId) // ownership check
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  return NextResponse.json({ goal: data });
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
