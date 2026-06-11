export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin-auth";
import { endExpiredCompetitions } from "@/lib/enrollment";
import { teamTotal } from "@/lib/points";

type Metric = "body_fat" | "muscle_mass" | "weight";

// GET: all ENDED competitions for the gym with final standings + body-scan results
export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  await endExpiredCompetitions(supabase, ctx.gymId);

  // Past competitions (newest first)
  const { data: comps } = await supabase
    .from("competitions")
    .select("id, name, start_date, end_date, body_scan_enabled, body_scan_metrics")
    .eq("gym_id", ctx.gymId)
    .eq("is_active", false)
    .order("end_date", { ascending: false });

  if (!comps || comps.length === 0) return NextResponse.json({ competitions: [] });

  const compIds = comps.map((c) => c.id);

  // Teams for those competitions
  const { data: teams } = await supabase
    .from("teams")
    .select("id, competition_id, name, color, total_points, bonus_points, enrollments(id)")
    .in("competition_id", compIds);

  // Body scans for those competitions' enrollments
  const enrollmentIds: string[] = (teams ?? []).flatMap((t) => (t.enrollments as unknown as { id: string }[]).map((e) => e.id));
  const scansByEnrollment: Record<string, { body_fat: number | null; muscle_mass: number | null; weight: number | null }[]> = {};
  if (enrollmentIds.length > 0) {
    const { data: scans } = await supabase
      .from("body_scans")
      .select("enrollment_id, body_fat, muscle_mass, weight, recorded_at")
      .in("enrollment_id", enrollmentIds)
      .order("recorded_at", { ascending: true });
    for (const s of scans ?? []) (scansByEnrollment[s.enrollment_id] ??= []).push(s);
  }

  // Map team id -> its enrollment ids (for body-scan aggregation)
  const teamEnrollments: Record<string, string[]> = {};
  for (const t of teams ?? []) {
    teamEnrollments[t.id] = (t.enrollments as unknown as { id: string }[]).map((e) => e.id);
  }

  const result = comps.map((c) => {
    const compTeams = (teams ?? []).filter((t) => t.competition_id === c.id);
    const standings = [...compTeams]
      .sort((a, b) => teamTotal(b) - teamTotal(a))
      .map((t, i) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        total: teamTotal(t),
        member_count: (t.enrollments as unknown as unknown[]).length,
        rank: i + 1,
      }));

    // Body-scan: per-team total change per metric (first -> latest)
    let bodyScan: { metrics: Metric[]; teams: { id: string; name: string; color: string; changes: Record<string, number | null> }[] } | null = null;
    if (c.body_scan_enabled) {
      const metrics = (c.body_scan_metrics ?? []) as Metric[];
      bodyScan = {
        metrics,
        teams: compTeams.map((t) => {
          const changes: Record<string, number | null> = {};
          for (const m of metrics) {
            let sum = 0;
            let any = false;
            for (const enrId of teamEnrollments[t.id] ?? []) {
              const list = scansByEnrollment[enrId] ?? [];
              if (list.length >= 2) {
                const f = list[0][m];
                const l = list[list.length - 1][m];
                if (f != null && l != null) { sum += Number(l) - Number(f); any = true; }
              }
            }
            changes[m] = any ? sum : null;
          }
          return { id: t.id, name: t.name, color: t.color, changes };
        }),
      };
    }

    return {
      id: c.id,
      name: c.name,
      start_date: c.start_date,
      end_date: c.end_date,
      standings,
      body_scan: bodyScan,
    };
  });

  return NextResponse.json({ competitions: result });
}
