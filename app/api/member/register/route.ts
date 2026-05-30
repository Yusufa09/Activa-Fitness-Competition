export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { display_name, join_code } = await req.json();

  if (!display_name?.trim() || !join_code?.trim()) {
    return NextResponse.json({ error: "Name and team code are required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up team by join code (case-insensitive)
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .ilike("join_code", join_code.trim())
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Team code not found. Check the code and try again." }, { status: 404 });
  }

  const cleanName = display_name.trim();

  // Check if member already exists for this name + team
  const { data: existing } = await supabase
    .from("members")
    .select("*")
    .eq("team_id", team.id)
    .ilike("display_name", cleanName)
    .single();

  if (existing) {
    // Return existing member (re-joining from a new device)
    return NextResponse.json({
      member: { ...existing, team },
      device_token: existing.device_token,
    });
  }

  // Create new member
  const device_token = uuidv4();
  const { data: member, error: insertError } = await supabase
    .from("members")
    .insert({ display_name: cleanName, team_id: team.id, device_token })
    .select()
    .single();

  if (insertError || !member) {
    return NextResponse.json({ error: "Could not create member. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ member: { ...member, team }, device_token });
}
