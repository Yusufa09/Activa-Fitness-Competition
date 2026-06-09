-- ============================================================
-- BODY SCAN MIGRATION — run once in the Supabase SQL Editor.
-- Adds the body-scan feature without wiping data. Safe to re-run.
-- ============================================================

-- Competition settings
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS body_scan_enabled       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS body_scan_metrics       TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS body_scan_goal_points   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS body_scan_winner_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS body_scan_winner_team_id UUID;

-- Durable team-level bonus (e.g. body-scan winner)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bonus_points INTEGER NOT NULL DEFAULT 0;

-- Goal kind ('standard' | 'body_scan')
ALTER TABLE goals ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'standard';

-- Body scans table (private)
CREATE TABLE IF NOT EXISTS body_scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  body_fat      NUMERIC,
  muscle_mass   NUMERIC,
  weight        NUMERIC,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE body_scans ENABLE ROW LEVEL SECURITY;  -- no public policies → private
