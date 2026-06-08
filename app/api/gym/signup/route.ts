export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueGymCode } from "@/lib/gym";
import { isValidEmail } from "@/lib/validation";

// Create a brand-new gym + its first administrator account.
export async function POST(req: NextRequest) {
  const { gym_name, email, password, first_name, last_name } = await req.json();

  if (!gym_name?.trim() || !email?.trim() || !password || !first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "Gym name, your name, email, and password are all required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Create the auth user (auto-confirmed so they can log in immediately)
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (authError || !created?.user) {
    const msg = authError?.message?.includes("already")
      ? "An account with that email already exists."
      : authError?.message ?? "Could not create account.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create the gym
  const gymCode = await generateUniqueGymCode(supabase);
  const { data: gym, error: gymError } = await supabase
    .from("gyms")
    .insert({ name: gym_name.trim(), gym_code: gymCode })
    .select()
    .single();

  if (gymError || !gym) {
    // Roll back the auth user if the gym couldn't be created
    await supabase.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not create gym." }, { status: 500 });
  }

  // Link the admin to the gym
  await supabase.from("gym_admins").insert({
    gym_id: gym.id,
    user_id: created.user.id,
    email: email.trim(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
  });

  return NextResponse.json({ gym: { id: gym.id, name: gym.name, gym_code: gym.gym_code } });
}
