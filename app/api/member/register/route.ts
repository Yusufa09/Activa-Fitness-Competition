export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMemberState } from "@/lib/enrollment";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { display_name, device_token } = await req.json();

  if (!display_name?.trim()) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const cleanName = display_name.trim();

  let member = null;

  // 1. Returning member on this device (token in localStorage)?
  if (device_token) {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("device_token", device_token)
      .single();
    member = data;
  }

  // 2. Otherwise match by name so the same person keeps their team + points
  //    even after signing out or switching devices.
  if (!member) {
    const { data } = await supabase
      .from("members")
      .select("*")
      .ilike("display_name", cleanName)
      .order("created_at", { ascending: true })
      .limit(1);
    member = data?.[0] ?? null;
  }

  // 3. Brand-new member
  if (!member) {
    const token = uuidv4();
    const { data, error } = await supabase
      .from("members")
      .insert({ display_name: cleanName, device_token: token })
      .select()
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Could not sign you in. Try again." }, { status: 500 });
    }
    member = data;
  }

  const state = await buildMemberState(supabase, member);
  return NextResponse.json({ ...state, device_token: member.device_token });
}
