export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

// Rotate the member's device_token so the old session is invalidated
// server-side. This prevents the page from re-saving a still-valid session
// after sign-out (the "takes 20 clicks" bug).
export async function POST(req: NextRequest) {
  const { device_token } = await req.json();
  if (!device_token) return NextResponse.json({ success: true });

  const supabase = createAdminClient();
  await supabase
    .from("members")
    .update({ device_token: uuidv4() })
    .eq("device_token", device_token);

  return NextResponse.json({ success: true });
}
