-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  join_code    TEXT NOT NULL UNIQUE,
  color        TEXT NOT NULL DEFAULT 'teal',
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (display_name, team_id)
);

-- ============================================================
-- CHALLENGES
-- ============================================================
CREATE TABLE challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  points         INTEGER NOT NULL DEFAULT 100,
  week_start     DATE NOT NULL,
  week_end       DATE NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('weekly', 'attendance')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS (one claim per member per challenge)
-- ============================================================
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  challenge_id  UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, challenge_id)
);

-- ============================================================
-- ATTENDANCE LOGS (one row per member per week, visit_count 1-3)
-- ============================================================
CREATE TABLE attendance_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  visit_count INTEGER NOT NULL DEFAULT 1 CHECK (visit_count BETWEEN 1 AND 3),
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, week_start)
);

-- ============================================================
-- TRIGGER: sync points on activity log insert
-- ============================================================
CREATE OR REPLACE FUNCTION sync_points_on_activity_log()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE members
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.member_id;

  UPDATE teams
    SET total_points = total_points + NEW.points_earned
    WHERE id = (SELECT team_id FROM members WHERE id = NEW.member_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_activity_points
  AFTER INSERT ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION sync_points_on_activity_log();

-- ============================================================
-- TRIGGER: award 100pts when 3rd gym visit is logged
-- ============================================================
CREATE OR REPLACE FUNCTION sync_attendance_bonus()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.visit_count = 3) OR
     (TG_OP = 'UPDATE' AND OLD.visit_count < 3 AND NEW.visit_count = 3) THEN
    UPDATE members
      SET total_points = total_points + 100
      WHERE id = NEW.member_id;

    UPDATE teams
      SET total_points = total_points + 100
      WHERE id = (SELECT team_id FROM members WHERE id = NEW.member_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_bonus
  AFTER INSERT OR UPDATE ON attendance_logs
  FOR EACH ROW EXECUTE FUNCTION sync_attendance_bonus();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_public_read" ON members FOR SELECT USING (true);
CREATE POLICY "members_public_insert" ON members FOR INSERT WITH CHECK (true);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_public_read" ON activity_logs FOR SELECT USING (true);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_logs_public_read" ON attendance_logs FOR SELECT USING (true);
