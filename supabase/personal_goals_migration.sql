-- ============================================================
-- PERSONAL GOALS MIGRATION — run once in the Supabase SQL Editor.
-- Member-defined personal goals with full challenge mechanics. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS personal_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenge-style fields (recurring, time windows, multi-completion, progress)
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS target_count     INTEGER NOT NULL DEFAULT 1;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS is_refreshable   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS refresh_interval TEXT;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS starts_at        DATE;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS ends_at          DATE;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS progress_count   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE personal_goals ADD COLUMN IF NOT EXISTS period_key       TEXT NOT NULL DEFAULT 'once';

-- Old boolean column from the first version is no longer used
ALTER TABLE personal_goals DROP COLUMN IF EXISTS completed;

ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;  -- private; API-only
