export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMemberState } from "@/lib/enrollment";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("device_token", token)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Resolves active competition + auto-enrolls if they joined mid-competition
  const state = await buildMemberState(supabase, member);
  return NextResponse.json(state);
}
