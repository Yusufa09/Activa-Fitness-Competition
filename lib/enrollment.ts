import { createAdminClient } from "@/lib/supabase/admin";
import { toDateString, teamTotal } from "@/lib/points";
import type { Competition, Enrollment, Member, Team, MemberState, Gym, LastCompetitionResult, TeamColor } from "@/types";

type Supa = ReturnType<typeof createAdminClient>;

/**
 * Auto-end any active competition whose end_date has already passed.
 * Competitions run THROUGH their end_date (inclusive), so we end them the day
 * after. This is a lazy check — it runs whenever the app reads competition data,
 * so no cron job is needed.
 */
export async function endExpiredCompetitions(supabase: Supa, gymId: string): Promise<void> {
  const today = toDateString(new Date());
  await supabase
    .from("competitions")
    .update({ is_active: false })
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .lt("end_date", today);
}

export async function getActiveCompetition(supabase: Supa, gymId: string): Promise<Competition | null> {
  await endExpiredCompetitions(supabase, gymId);
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

/**
 * Ensure the member is enrolled in their gym's active competition.
 * Assigns them to the team with the fewest members (random tie-break)
 * so teams stay balanced — including members who join mid-competition.
 */
export async function ensureEnrollment(
  supabase: Supa,
  memberId: string,
  competition: Competition
): Promise<(Enrollment & { team: Team }) | null> {
  const { data: existing } = await supabase
    .from("enrollments")
    .select("*, team:teams(*)")
    .eq("member_id", memberId)
    .eq("competition_id", competition.id)
    .single();

  if (existing) return existing as Enrollment & { team: Team };

  const { data: teams } = await supabase
    .from("teams")
    .select("*, enrollments(count)")
    .eq("competition_id", competition.id);

  if (!teams || teams.length === 0) return null;

  const withCounts = teams.map((t) => ({
    team: t as Team,
    count: (t.enrollments as unknown as [{ count: number }])[0]?.count ?? 0,
  }));

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

/**
 * The member's most recent ENDED competition: their team's final placement and
 * the full standings. Shown on the in-between screen until the next one starts.
 */
export async function getLastResult(supabase: Supa, member: Member): Promise<LastCompetitionResult | null> {
  const { data: rows } = await supabase
    .from("enrollments")
    .select("team_id, competition:competitions(id, name, is_active, end_date, created_at)")
    .eq("member_id", member.id);

  type Row = { team_id: string; competition: { id: string; name: string; is_active: boolean; end_date: string; created_at: string } | null };
  const ended = ((rows ?? []) as unknown as Row[])
    .filter((r) => r.competition && !r.competition.is_active)
    .sort((a, b) => (b.competition!.end_date || b.competition!.created_at).localeCompare(a.competition!.end_date || a.competition!.created_at));

  const latest = ended[0];
  if (!latest || !latest.competition) return null;

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color, total_points, bonus_points")
    .eq("competition_id", latest.competition.id);
  if (!teams || teams.length === 0) return null;

  const ranked = [...teams]
    .sort((a, b) => teamTotal(b) - teamTotal(a))
    .map((t, i) => ({ id: t.id, name: t.name, color: t.color as TeamColor, total: teamTotal(t), rank: i + 1 }));

  const myTeam = ranked.find((t) => t.id === latest.team_id);
  if (!myTeam) return null;

  return {
    competition_name: latest.competition.name,
    team_id: myTeam.id,
    team_name: myTeam.name,
    team_color: myTeam.color,
    rank: myTeam.rank,
    total_teams: ranked.length,
    standings: ranked,
  };
}

export async function buildMemberState(supabase: Supa, member: Member): Promise<MemberState> {
  const { data: gym } = await supabase.from("gyms").select("*").eq("id", member.gym_id).single();

  const competition = await getActiveCompetition(supabase, member.gym_id);
  if (!competition) {
    const last_result = await getLastResult(supabase, member);
    return { member, gym: gym as Gym, competition: null, enrollment: null, last_result };
  }
  const enrollment = await ensureEnrollment(supabase, member.id, competition);
  return { member, gym: gym as Gym, competition, enrollment, last_result: null };
}
