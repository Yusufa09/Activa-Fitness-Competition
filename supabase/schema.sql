-- ============================================================
-- v3 SCHEMA — Multi-gym platform with password accounts
-- Running this WIPES existing data. Run in Supabase SQL Editor.
-- ============================================================

DROP TABLE IF EXISTS goal_logs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS admin_invites CASCADE;
DROP TABLE IF EXISTS gym_admins CASCADE;
DROP TABLE IF EXISTS gyms CASCADE;

-- ============================================================
-- GYMS
-- ============================================================
CREATE TABLE gyms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  gym_code   TEXT NOT NULL UNIQUE,            -- short join code, e.g. "OTF4K2"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GYM ADMINS (links Supabase auth users to a gym)
-- ============================================================
CREATE TABLE gym_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,                   -- references auth.users(id)
  email      TEXT,
  first_name TEXT,
  last_name  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)                            -- one gym per admin account
);

-- ============================================================
-- ADMIN INVITES (pending invitations by email)
-- ============================================================
CREATE TABLE admin_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  accepted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, email)
);

-- ============================================================
-- MEMBERS (password accounts, scoped to a gym)
-- ============================================================
CREATE TABLE members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  device_token  TEXT NOT NULL UNIQUE,         -- session token issued on login
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, display_name)               -- name is the login key within a gym
);

-- ============================================================
-- COMPETITIONS (scoped to a gym)
-- ============================================================
CREATE TABLE competitions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  -- Body scan settings
  body_scan_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  body_scan_metrics       TEXT[]  NOT NULL DEFAULT '{}',  -- subset of body_fat / muscle_mass / weight
  body_scan_goal_points   INTEGER NOT NULL DEFAULT 0,     -- points for completing your first scan
  body_scan_winner_points INTEGER NOT NULL DEFAULT 0,     -- bonus for the winning team
  body_scan_winner_team_id UUID,                          -- null until the admin declares a winner
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  color          TEXT NOT NULL DEFAULT 'orange',
  total_points   INTEGER NOT NULL DEFAULT 0,
  bonus_points   INTEGER NOT NULL DEFAULT 0,   -- durable team award (e.g. body-scan winner), separate from goal points
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS (a member's place in a competition)
-- ============================================================
CREATE TABLE enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points         INTEGER NOT NULL DEFAULT 0,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, competition_id)
);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE goals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id   UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  points           INTEGER NOT NULL DEFAULT 100,
  target_count     INTEGER NOT NULL DEFAULT 1,
  is_refreshable   BOOLEAN NOT NULL DEFAULT FALSE,
  refresh_interval TEXT CHECK (refresh_interval IN ('daily', 'weekly')),
  starts_at        DATE,
  ends_at          DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  kind             TEXT NOT NULL DEFAULT 'standard',  -- 'standard' | 'body_scan' (auto-created, completed by submitting a scan)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GOAL LOGS (per-period progress per enrollment)
-- ============================================================
CREATE TABLE goal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  goal_id       UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  period_key    TEXT NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, goal_id, period_key)
);

-- ============================================================
-- TRIGGER: keep enrollment + team point totals in sync
-- ============================================================
CREATE OR REPLACE FUNCTION sync_points_on_goal_log()
RETURNS TRIGGER AS $$
DECLARE
  delta INTEGER;
BEGIN
  delta := NEW.points_earned - COALESCE(OLD.points_earned, 0);
  IF delta = 0 THEN RETURN NEW; END IF;

  UPDATE enrollments SET points = points + delta WHERE id = NEW.enrollment_id;
  UPDATE teams SET total_points = total_points + delta
    WHERE id = (SELECT team_id FROM enrollments WHERE id = NEW.enrollment_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_goal_points
  AFTER INSERT OR UPDATE ON goal_logs
  FOR EACH ROW EXECUTE FUNCTION sync_points_on_goal_log();

-- ============================================================
-- BODY SCANS (private — multiple per enrollment; first vs latest compared)
-- ============================================================
CREATE TABLE body_scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  body_fat      NUMERIC,   -- percent
  muscle_mass   NUMERIC,   -- lbs
  weight        NUMERIC,   -- lbs
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERSONAL GOALS (private — a member's own goals for a competition)
-- ============================================================
CREATE TABLE personal_goals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  target_count     INTEGER NOT NULL DEFAULT 1,
  is_refreshable   BOOLEAN NOT NULL DEFAULT FALSE,
  refresh_interval TEXT CHECK (refresh_interval IN ('daily', 'weekly')),
  starts_at        DATE,
  ends_at          DATE,
  progress_count   INTEGER NOT NULL DEFAULT 0,   -- completions in the current period
  period_key       TEXT NOT NULL DEFAULT 'once', -- which period progress_count applies to
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (writes go through service-role API routes)
-- ============================================================
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gyms_public_read" ON gyms FOR SELECT USING (true);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitions_public_read" ON competitions FOR SELECT USING (true);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_public_read" ON goals FOR SELECT USING (true);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_public_read" ON enrollments FOR SELECT USING (true);

ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_logs_public_read" ON goal_logs FOR SELECT USING (true);

-- members, gym_admins, admin_invites, body_scans, personal_goals: no public
-- policies — only the service-role API can read/write them (private data).
ALTER TABLE body_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
