-- 0007: counts behind the public results page (design B « Le relevé »).
--
-- monthly_stats only keeps an average per month. The results page shows the
-- number of each answer (5 levels of satisfaction, yes / partly / no) and the
-- number of « Bien » and « Pas bien » per topic. Two materialized views, at the
-- same grain as monthly_stats (establishment, service, month of visit), hold
-- those counts; the publication window (last 3 months) and the threshold
-- (10 feedbacks) are applied when reading, as for monthly_stats, so changing
-- them never needs a migration.
--
-- Same feedbacks as monthly_stats: a known recent visit month, the essential
-- question answered; those of a merged establishment count for the one that
-- replaces it. Refreshed every night with monthly_stats.

-- The feedbacks that count in the published results, written once for both views.
CREATE VIEW published_feedback AS
SELECT fb.id,
       coalesce(e.merged_into_id, e.id) AS establishment_id,
       coalesce(fb.service_id, 0) AS service_key,
       fb.visit_month AS month
FROM feedback fb
JOIN establishment e ON e.id = fb.establishment_id
WHERE fb.visit_month IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM answer a
    JOIN question q ON q.id = a.question_id
    WHERE a.feedback_id = fb.id AND q.code = 'OVERALL_SATISFACTION'
  );

-- One row per answer option of any question of the bank: a question asked in
-- several sectors keeps its code and options, so a new published indicator
-- (waiting time, receipt…) is a read, not a new view. Free text is never counted.
CREATE MATERIALIZED VIEW monthly_answer_counts AS
SELECT c.establishment_id,
       c.service_key,
       c.month,
       a.question_id,
       a.option_id,
       count(*)::int AS answer_count
FROM published_feedback c
JOIN answer a ON a.feedback_id = c.id
WHERE a.option_id IS NOT NULL
GROUP BY c.establishment_id, c.service_key, c.month, a.question_id, a.option_id;

CREATE UNIQUE INDEX monthly_answer_counts_key
  ON monthly_answer_counts (establishment_id, service_key, month, question_id, option_id);

-- One row per topic of screen 2b: how many said « Bien » and « Pas bien ».
-- The « Autre » topic is left out: what the user typed there is never published.
CREATE MATERIALIZED VIEW monthly_topic_counts AS
SELECT c.establishment_id,
       c.service_key,
       c.month,
       ft.topic_id,
       count(*) FILTER (WHERE ft.sentiment = 'positive')::int AS positive_count,
       count(*) FILTER (WHERE ft.sentiment = 'negative')::int AS negative_count
FROM published_feedback c
JOIN feedback_topic ft ON ft.feedback_id = c.id
JOIN topic t ON t.id = ft.topic_id
WHERE t.code <> 'OTHER'
GROUP BY c.establishment_id, c.service_key, c.month, ft.topic_id;

CREATE UNIQUE INDEX monthly_topic_counts_key
  ON monthly_topic_counts (establishment_id, service_key, month, topic_id);
