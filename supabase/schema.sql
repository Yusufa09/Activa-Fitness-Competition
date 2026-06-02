-- ============================================================
-- CLEAN SLATE (safe to re-run — drops old objects first)
-- ============================================================
DROP TABLE IF EXISTS goal_logs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP FUNCTION IF EXISTS sync_points_on_activity_log CASCADE;
DROP FUNCTION IF EXISTS sync_attendance_bonus CASCADE;

-- ============================================================
-- COMPETITIONS  (only one active at a time)
-- ============================================================
CREATE TABLE competitions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce at most one active competition
CREATE UNIQUE INDEX one_active_competition
  ON competitions (is_active)
  WHERE is_active = TRUE;

-- ============================================================
-- TEAMS  (belong to a competition)
-- ============================================================
CREATE TABLE teams (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  color          TEXT NOT NULL DEFAULT 'orange',
  total_points   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEMBERS  (global identity — name + device token)
-- ============================================================
CREATE TABLE members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  device_token TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS  (a member's spot in a competition + team)
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
-- GOALS  (flexible tasks/challenges within a competition)
--   - target_count: how many times to complete to earn points (1 = single)
--   - is_refreshable + refresh_interval: resets each day/week
--   - starts_at / ends_at: optional active window (defaults to competition span)
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
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GOAL LOGS  (one row per enrollment per goal per period)
--   period_key: 'once' | a date (daily) | 'YYYY-Www' (weekly)
--   count: progress toward target within this period
-- ============================================================
CREATE TABLE goal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  goal_id       UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  period_key    TEXT NOT NULL DEFAULT 'once',
  count         INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, goal_id, period_key)
);

-- ============================================================
-- ROW LEVEL SECURITY  (public read; writes go through service-role API)
-- ============================================================
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitions_public_read" ON competitions FOR SELECT USING (true);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_public_read" ON members FOR SELECT USING (true);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_public_read" ON enrollments FOR SELECT USING (true);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_public_read" ON goals FOR SELECT USING (true);

ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_logs_public_read" ON goal_logs FOR SELECT USING (true);
