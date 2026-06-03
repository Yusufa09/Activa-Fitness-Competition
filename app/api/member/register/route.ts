export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMemberState } from "@/lib/enrollment";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// First-time join: name + password + gym code.
// If the name already exists in that gym, treat it as a login (verify password).
export async function POST(req: NextRequest) {
  const { display_name, password, gym_code } = await req.json();

  if (!display_name?.trim() || !password || !gym_code?.trim()) {
    return NextResponse.json({ error: "Name, password, and gym code are all required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const cleanName = display_name.trim();

  // Resolve the gym by code
  const { data: gym } = await supabase
    .from("gyms").select("id, name").ilike("gym_code", gym_code.trim()).maybeSingle();
  if (!gym) {
    return NextResponse.json({ error: "Gym code not found. Check the code and try again." }, { status: 404 });
  }

  // Existing member with this name in this gym?
  const { data: existing } = await supabase
    .from("members")
    .select("*")
    .eq("gym_id", gym.id)
    .ilike("display_name", cleanName)
    .maybeSingle();

  let member;
  if (existing) {
    // Name taken — only let them in if the password matches (returning user)
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "That name is already taken at this gym. If it's you, enter your password." },
        { status: 409 }
      );
    }
    // Issue a fresh session token
    const token = uuidv4();
    const { data: updated } = await supabase
      .from("members").update({ device_token: token }).eq("id", existing.id).select().single();
    member = updated;
  } else {
    const password_hash = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const { data: created, error } = await supabase
      .from("members")
      .insert({ gym_id: gym.id, display_name: cleanName, password_hash, device_token: token })
      .select()
      .single();
    if (error || !created) {
      return NextResponse.json({ error: "Could not create your account. Try again." }, { status: 500 });
    }
    member = created;
  }

  const state = await buildMemberState(supabase, member);
  return NextResponse.json({ state, device_token: member.device_token });
}
