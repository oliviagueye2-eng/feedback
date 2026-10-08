-- 0032: the two school administration services ask the questions of
-- FILE_SERVICES (decided by Olivia, 2026-10-08). The question list
-- SCHOOL_ADMIN held the same six questions, in the same order and with the
-- same condition, so nothing changes for a user or in the results; it is
-- deleted (its items and condition go with it). The topic list SCHOOL_ADMIN
-- stays.

UPDATE service
SET question_set_id = (SELECT id FROM question_set WHERE code = 'FILE_SERVICES')
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'SCHOOL_ADMIN');

DELETE FROM question_set WHERE code = 'SCHOOL_ADMIN';
