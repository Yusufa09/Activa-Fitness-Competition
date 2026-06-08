-- ============================================================
-- ONE-TIME DATA REPAIR — run once in the Supabase SQL Editor
-- after deploying the points double-count fix.
-- Recomputes all point totals from the authoritative goal_logs.
-- Safe to re-run.
-- ============================================================

-- Each enrollment's points = sum of its goal_logs.points_earned
UPDATE enrollments e
SET points = COALESCE(
  (SELECT SUM(gl.points_earned) FROM goal_logs gl WHERE gl.enrollment_id = e.id),
  0
);

-- Each team's total = sum of its enrollments' points
UPDATE teams t
SET total_points = COALESCE(
  (SELECT SUM(en.points) FROM enrollments en WHERE en.team_id = t.id),
  0
);

-- ============================================================
-- MIGRATION: add gym administrator names (no data wipe needed).
-- Safe to re-run.
-- ============================================================
ALTER TABLE gym_admins ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE gym_admins ADD COLUMN IF NOT EXISTS last_name  TEXT;
