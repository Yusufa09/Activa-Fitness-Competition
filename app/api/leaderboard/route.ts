export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, members(count)")
    .order("total_points", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const teams = (data ?? []).map((t, i) => ({
    ...t,
    rank: i + 1,
    member_count: (t.members as unknown as [{ count: number }])[0]?.count ?? 0,
  }));

  return NextResponse.json({ teams });
}
