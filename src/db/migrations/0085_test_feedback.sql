-- 0085: test feedbacks (test mode asked by Olivia, 2026-10-16).
--
-- A browser where the back-office turned the test mode on (a signed cookie,
-- 7 days) sends feedbacks marked as tests: they are saved like the others, so
-- the whole path can be tried on the live site, but never count in the public
-- results nor in the dashboard's figures, and the back-office deletes them all
-- at once. Every feedback given so far is a real one.
ALTER TABLE feedback ADD COLUMN is_test boolean NOT NULL DEFAULT false;

-- Same columns as 0028, so the counts built on this view keep working
-- (monthly_answer_counts, monthly_topic_counts: recomputed each night).
CREATE OR REPLACE VIEW published_feedback AS
SELECT fb.id,
       coalesce(e.merged_into_id, e.id) AS establishment_id,
       coalesce(fb.service_id, 0) AS service_key,
       fb.visit_month AS month
FROM feedback fb
JOIN establishment e ON e.id = fb.establishment_id
WHERE fb.visit_month IS NOT NULL
  AND fb.step = 'completed'
  AND fb.attested_at IS NOT NULL
  AND NOT fb.is_test
  AND e.status <> 'rejected'
  AND EXISTS (
    SELECT 1
    FROM answer a
    JOIN question q ON q.id = a.question_id
    WHERE a.feedback_id = fb.id AND q.code = 'OVERALL_SATISFACTION'
  );

-- The average per month (0001), recomputed each night too: rebuilt without
-- the test feedbacks (a materialized view cannot be replaced in place).
DROP MATERIALIZED VIEW monthly_stats;

CREATE MATERIALIZED VIEW monthly_stats AS
WITH f AS (
  SELECT fb.id,
         coalesce(e.merged_into_id, e.id) AS establishment_id,
         fb.service_id,
         fb.visit_month
  FROM feedback fb
  JOIN establishment e ON e.id = fb.establishment_id
  WHERE fb.visit_month IS NOT NULL
    AND NOT fb.is_test
),
satisfaction AS (
  SELECT a.feedback_id, ao.value
  FROM answer a
  JOIN question q ON q.id = a.question_id
  JOIN answer_option ao ON ao.id = a.option_id
  WHERE q.code = 'OVERALL_SATISFACTION'
),
goal AS (
  SELECT a.feedback_id, ao.code
  FROM answer a
  JOIN question q ON q.id = a.question_id
  JOIN answer_option ao ON ao.id = a.option_id
  WHERE q.code = 'GOAL_ACHIEVED'
)
SELECT f.establishment_id,
       f.service_id,
       coalesce(f.service_id, 0) AS service_key,
       f.visit_month AS month,
       count(s.value) AS feedback_count,
       round(avg(s.value), 2) AS avg_satisfaction,
       round(avg(CASE g.code WHEN 'YES' THEN 1 WHEN 'PARTLY' THEN 0.5 WHEN 'NO' THEN 0 END), 3)
         AS goal_achieved_rate
FROM f
JOIN satisfaction s ON s.feedback_id = f.id
LEFT JOIN goal g ON g.feedback_id = f.id
GROUP BY f.establishment_id, f.service_id, f.visit_month;

-- Required by REFRESH ... CONCURRENTLY (column names only, no NULLs).
CREATE UNIQUE INDEX monthly_stats_key ON monthly_stats (establishment_id, service_key, month);
