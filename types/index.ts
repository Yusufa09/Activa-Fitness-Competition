export type TeamColor = "teal" | "violet" | "amber" | "sky";

export interface Team {
  id: string;
  name: string;
  join_code: string;
  color: TeamColor;
  total_points: number;
  created_at: string;
}

export interface Member {
  id: string;
  display_name: string;
  team_id: string;
  device_token: string;
  total_points: number;
  created_at: string;
  team?: Team;
}

export type ChallengeType = "weekly" | "attendance";

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  week_start: string;
  week_end: string;
  challenge_type: ChallengeType;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  member_id: string;
  challenge_id: string;
  points_earned: number;
  logged_at: string;
}

export interface AttendanceLog {
  id: string;
  member_id: string;
  week_start: string;
  visit_count: number;
  logged_at: string;
}

// Enriched challenge with member's completion status
export interface ChallengeWithStatus extends Challenge {
  completed: boolean;
}

// Member session stored in localStorage
export interface MemberSession {
  device_token: string;
  member_id: string;
  display_name: string;
  team_id: string;
  team_name: string;
  team_color: TeamColor;
}

// API response shapes
export interface ApiError {
  error: string;
}

export interface RegisterResponse {
  member: Member;
  device_token: string;
}

export interface SessionResponse {
  member: Member & { team: Team };
}

export interface LogActivityResponse {
  success: boolean;
  points_earned: number;
  new_total: number;
}

export interface LeaderboardTeam extends Team {
  rank: number;
  member_count: number;
}
