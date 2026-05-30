-- Seed 4 initial teams
INSERT INTO teams (name, join_code, color) VALUES
  ('Team Alpha',   'ALPHA',   'teal'),
  ('Team Bravo',   'BRAVO',   'violet'),
  ('Team Charlie', 'CHARLIE', 'amber'),
  ('Team Delta',   'DELTA',   'sky');

-- Seed sample weekly challenges for the current week
-- Update the dates before running in production
INSERT INTO challenges (title, description, points, week_start, week_end, challenge_type, is_active) VALUES
  ('Drink 8 Glasses of Water', 'Stay hydrated! Drink at least 8 glasses of water today.', 100, CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1), CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER), 'weekly', true),
  ('Eat a Healthy Meal', 'Prepare or choose a nutritious, balanced meal today.', 100, CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1), CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER), 'weekly', true),
  ('Sleep 8 Hours', 'Get a full night of rest — aim for at least 8 hours of sleep.', 100, CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1), CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER), 'weekly', true);
