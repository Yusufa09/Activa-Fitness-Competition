-- ============================================================
-- SAMPLE COMPETITION  ("Spring Fitness", ~3 months from today)
-- ============================================================
INSERT INTO competitions (name, start_date, end_date, is_active)
VALUES ('Spring Fitness Challenge', CURRENT_DATE, CURRENT_DATE + 90, TRUE);

-- 4 teams for the competition
INSERT INTO teams (competition_id, name, color)
SELECT id, t.name, t.color
FROM competitions c,
  (VALUES
    ('Blazers',  'orange'),
    ('Risers',   'rose'),
    ('Titans',   'blue'),
    ('Surge',    'emerald')
  ) AS t(name, color)
WHERE c.is_active = TRUE;

-- Sample goals of each kind
INSERT INTO goals (competition_id, title, description, points, target_count, is_refreshable, refresh_interval, is_active)
SELECT c.id, g.title, g.description, g.points, g.target_count, g.is_refreshable, g.refresh_interval, TRUE
FROM competitions c,
  (VALUES
    -- Recurring daily task
    ('Drink 8 Glasses of Water', 'Stay hydrated every day.', 50, 1, TRUE, 'daily'),
    -- Recurring weekly task
    ('Eat 5 Healthy Meals', 'Choose nutritious meals through the week.', 100, 1, TRUE, 'weekly'),
    -- Multi-count goal that refreshes weekly (the old "gym attendance")
    ('Go to the Gym 3x', 'Visit the gym three times this week.', 100, 3, TRUE, 'weekly'),
    -- One-time task for the whole competition
    ('Set a Fitness Goal', 'Write down a personal fitness goal for the season.', 75, 1, FALSE, NULL)
  ) AS g(title, description, points, target_count, is_refreshable, refresh_interval)
WHERE c.is_active = TRUE;
