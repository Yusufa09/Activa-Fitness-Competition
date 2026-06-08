export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { isValidEmail } from "@/lib/validation";
import { sendAdminInviteEmail } from "@/lib/email";

// List current administrators + pending invites for the caller's gym
export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const [{ data: admins }, { data: invites }, { data: gym }] = await Promise.all([
    supabase.from("gym_admins").select("id, email, first_name, last_name, created_at").eq("gym_id", ctx.gymId).order("created_at"),
    supabase.from("admin_invites").select("id, email, accepted, created_at").eq("gym_id", ctx.gymId).eq("accepted", false),
    supabase.from("gyms").select("name, gym_code").eq("id", ctx.gymId).single(),
  ]);

  return NextResponse.json({ admins: admins ?? [], invites: invites ?? [], gym });
}

// Invite a new admin by email
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  const cleanEmail = email.trim().toLowerCase();

  const supabase = createAdminClient();

  // Already an administrator of this gym?
  const { data: existing } = await supabase
    .from("gym_admins").select("id").eq("gym_id", ctx.gymId).ilike("email", cleanEmail).maybeSingle();
  if (existing) return NextResponse.json({ error: "That email is already an administrator." }, { status: 409 });

  const { error } = await supabase
    .from("admin_invites")
    .upsert({ gym_id: ctx.gymId, email: cleanEmail, accepted: false }, { onConflict: "gym_id,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort invite email (never blocks the in-app invite)
  const { data: gym } = await supabase.from("gyms").select("name").eq("id", ctx.gymId).single();
  await sendAdminInviteEmail(cleanEmail, gym?.name ?? "a gym");

  return NextResponse.json({ success: true });
}

// Revoke a pending invite
export async function DELETE(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invite_id } = await req.json();
  if (!invite_id) return NextResponse.json({ error: "invite_id is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_invites").delete().eq("id", invite_id).eq("gym_id", ctx.gymId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
