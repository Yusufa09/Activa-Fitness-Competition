import { createAdminClient } from "@/lib/supabase/admin";
import type { Competition, Enrollment, Member, Team, MemberState } from "@/types";

type Supa = ReturnType<typeof createAdminClient>;

export async function getActiveCompetition(supabase: Supa): Promise<Competition | null> {
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .eq("is_active", true)
    .single();
  return data ?? null;
}

/**
 * Ensure the member is enrolled in the active competition.
 * Assigns them to the team with the fewest members (random tie-break)
 * so teams stay balanced — including members who join mid-competition.
 */
export async function ensureEnrollment(
  supabase: Supa,
  memberId: string,
  competition: Competition
): Promise<(Enrollment & { team: Team }) | null> {
  // Already enrolled?
  const { data: existing } = await supabase
    .from("enrollments")
    .select("*, team:teams(*)")
    .eq("member_id", memberId)
    .eq("competition_id", competition.id)
    .single();

  if (existing) return existing as Enrollment & { team: Team };

  // Load teams + their current enrollment counts
  const { data: teams } = await supabase
    .from("teams")
    .select("*, enrollments(count)")
    .eq("competition_id", competition.id);

  if (!teams || teams.length === 0) return null;

  const withCounts = teams.map((t) => ({
    team: t as Team,
    count: (t.enrollments as unknown as [{ count: number }])[0]?.count ?? 0,
  }));

  // Smallest teams, random pick among ties
  const min = Math.min(...withCounts.map((w) => w.count));
  const smallest = withCounts.filter((w) => w.count === min);
  const chosen = smallest[Math.floor(Math.random() * smallest.length)].team;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .insert({ member_id: memberId, competition_id: competition.id, team_id: chosen.id })
    .select("*, team:teams(*)")
    .single();

  return (enrollment as Enrollment & { team: Team }) ?? null;
}

export async function buildMemberState(supabase: Supa, member: Member): Promise<MemberState> {
  const competition = await getActiveCompetition(supabase);
  if (!competition) {
    return { member, competition: null, enrollment: null };
  }
  const enrollment = await ensureEnrollment(supabase, member.id, competition);
  return { member, competition, enrollment };
}
