-- 0059: a refused credit is a decision, not a bad service (decided by Olivia,
-- 2026-10-09): « Oui, refusée » no longer counts in the results, like « Je n'ai
-- rien payé » (no value).
UPDATE answer_option SET value = NULL
WHERE code = 'REFUSED' AND question_id = (SELECT id FROM question WHERE code = 'CREDIT_ANSWER');
