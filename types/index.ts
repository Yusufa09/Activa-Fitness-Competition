export type TeamColor = "orange" | "rose" | "blue" | "emerald" | "violet" | "amber" | "sky" | "teal";

export type RefreshInterval = "daily" | "weekly";

export interface Gym {
  id: string;
  name: string;
  gym_code: string;
  created_at: string;
}

export interface GymAdmin {
  id: string;
  gym_id: string;
  user_id: string;
  email: string | null;
  created_at: string;
}

export interface AdminInvite {
  id: string;
  gym_id: string;
  email: string;
  accepted: boolean;
  created_at: string;
}

export interface Competition {
  id: string;
  gym_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  competition_id: string;
  name: string;
  color: TeamColor;
  total_points: number;
  created_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  display_name: string;
  device_token: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  member_id: string;
  competition_id: string;
  team_id: string;
  points: number;
  joined_at: string;
}

export interface Goal {
  id: string;
  competition_id: string;
  title: string;
  description: string | null;
  points: number;
  target_count: number;
  is_refreshable: boolean;
  refresh_interval: RefreshInterval | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GoalLog {
  id: string;
  enrollment_id: string;
  goal_id: string;
  period_key: string;
  count: number;
  points_earned: number;
  updated_at: string;
}

// Goal enriched with the member's current-period progress
export interface GoalWithProgress extends Goal {
  progress: number; // count completed this period
  completed: boolean; // progress >= target_count
}

// Member session stored in localStorage
export interface MemberSession {
  device_token: string;
  member_id: string;
  display_name: string;
  gym_id: string;
  gym_name: string;
}

// Resolved state returned by register/session APIs
export interface MemberState {
  member: Member;
  gym: Gym;
  competition: Competition | null;
  enrollment: (Enrollment & { team: Team }) | null;
}

export interface LeaderboardTeam extends Team {
  rank: number;
  member_count: number;
}
