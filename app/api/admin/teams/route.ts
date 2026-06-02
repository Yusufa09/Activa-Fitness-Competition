export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!competition) return NextResponse.json({ competition: null, teams: [] });

  const { data, error } = await supabase
    .from("teams")
    .select("*, enrollments(id, points, member:members(display_name, created_at))")
    .eq("competition_id", competition.id)
    .order("total_points", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competition, teams: data });
}
