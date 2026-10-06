-- 0024: only the feedbacks sent from the last screen count in the published
-- results (decided by Olivia, 2026-10-06): complete, with the e-mail or phone
-- number and the statement on honour (0023). A feedback stopped before
-- « Envoyer mon avis » is kept but never published: comparing its
-- satisfaction with that of the complete ones will tell whether the last
-- screen puts off some users. Same columns, so the counts built on this view
-- (0007) keep working; they change at their next refresh.

CREATE OR REPLACE VIEW published_feedback AS
SELECT fb.id,
       coalesce(e.merged_into_id, e.id) AS establishment_id,
       coalesce(fb.service_id, 0) AS service_key,
       fb.visit_month AS month
FROM feedback fb
JOIN establishment e ON e.id = fb.establishment_id
WHERE fb.visit_month IS NOT NULL
  AND fb.step = 'completed'
  AND EXISTS (SELECT 1 FROM feedback_contact c WHERE c.feedback_id = fb.id)
  AND EXISTS (
    SELECT 1
    FROM answer a
    JOIN question q ON q.id = a.question_id
    WHERE a.feedback_id = fb.id AND q.code = 'OVERALL_SATISFACTION'
  );
