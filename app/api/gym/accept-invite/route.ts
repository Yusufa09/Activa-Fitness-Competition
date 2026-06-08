export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/lib/validation";

// An invited email creates their administrator account and joins the gym they were invited to.
export async function POST(req: NextRequest) {
  const { email, password, first_name, last_name } = await req.json();

  if (!email?.trim() || !password || !first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "Your name, email, and password are all required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const cleanEmail = email.trim().toLowerCase();

  // Find a pending invite for this email
  const { data: invite } = await supabase
    .from("admin_invites")
    .select("*")
    .ilike("email", cleanEmail)
    .eq("accepted", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "No invitation found for this email. Ask a gym admin to invite you first." },
      { status: 404 }
    );
  }

  // Create the auth user
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  });

  if (authError || !created?.user) {
    const msg = authError?.message?.includes("already")
      ? "An account with that email already exists. Just log in."
      : authError?.message ?? "Could not create account.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Link to the invited gym + mark invite accepted
  await supabase.from("gym_admins").insert({
    gym_id: invite.gym_id,
    user_id: created.user.id,
    email: cleanEmail,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
  });
  await supabase.from("admin_invites").update({ accepted: true }).eq("id", invite.id);

  return NextResponse.json({ success: true });
}
