-- ============================================================
-- PERSONAL GOALS MIGRATION — run once in the Supabase SQL Editor.
-- Adds member-defined personal goals. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS personal_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;  -- private; API-only
