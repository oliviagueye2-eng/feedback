-- 0028: the back-office (validated by Olivia, 2026-10-07).
--
-- 1. The page a feedback stopped on. Each screen after the essential question
--    records itself when shown; a feedback never sent therefore tells which
--    page the person left without submitting (dashboard: « Abandons par étape »).
ALTER TABLE feedback
  ADD COLUMN last_page text CHECK (last_page IN ('details', 'sector', 'common', 'send'));

-- 2. When the statement on honour was ticked, on the feedback itself. 0024
--    published a feedback only while its contact existed, but the contact is
--    deleted 12 months after the person's last feedback (privacy policy): the
--    feedback would then have left the results. The statement stays.
ALTER TABLE feedback ADD COLUMN attested_at timestamptz;

UPDATE feedback fb
SET attested_at = c.attested_at
FROM feedback_contact c
WHERE c.feedback_id = fb.id;

-- Same columns as 0024, so the counts built on this view keep working. A
-- refused establishment (back-office) no longer counts.
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
  AND e.status <> 'rejected'
  AND EXISTS (
    SELECT 1
    FROM answer a
    JOIN question q ON q.id = a.question_id
    WHERE a.feedback_id = fb.id AND q.code = 'OVERALL_SATISFACTION'
  );

-- 3. Comments are never published: the team reads them. « reviewed » = read
--    (personal details already removed if any).
ALTER TABLE comment DROP CONSTRAINT comment_status_check;
ALTER TABLE comment ADD CONSTRAINT comment_status_check
  CHECK (status IN ('pending', 'reviewed', 'published', 'hidden'));

-- 4. Failed sign-ins to the back-office, by address: 5 in 15 minutes block
--    that address for 15 minutes. Emptied each night after one day.
CREATE TABLE admin_login_attempt (
  ip           text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_login_attempt_ip_idx ON admin_login_attempt (ip, attempted_at);
