export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMemberState } from "@/lib/enrollment";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Returning member: name + password, no gym needed.
// Global lookup — find the member across all gyms whose name + password match.
export async function POST(req: NextRequest) {
  const { display_name, password } = await req.json();

  if (!display_name?.trim() || !password) {
    return NextResponse.json({ error: "Name and password are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const cleanName = display_name.trim();

  // All members across gyms with this name (names are unique per gym, so at most one per gym)
  const { data: candidates } = await supabase
    .from("members")
    .select("*")
    .ilike("display_name", cleanName);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ error: "No account found with that name and password." }, { status: 404 });
  }

  // Find which one's password matches
  const matches = [];
  for (const c of candidates) {
    if (await bcrypt.compare(password, c.password_hash)) matches.push(c);
  }

  if (matches.length === 0) {
    return NextResponse.json({ error: "No account found with that name and password." }, { status: 404 });
  }
  if (matches.length > 1) {
    return NextResponse.json(
      { error: "Multiple gyms have this name. Please use 'First time' with your gym code to sign in." },
      { status: 409 }
    );
  }

  // Issue a fresh session token
  const token = uuidv4();
  const { data: member } = await supabase
    .from("members").update({ device_token: token }).eq("id", matches[0].id).select().single();

  const state = await buildMemberState(supabase, member);
  return NextResponse.json({ state, device_token: member!.device_token });
}
