-- Wording only (validated 2026-10-01): the meaning and the answers do not
-- change, so the feedbacks already given stay comparable (same questions).
--  - « Avez-vous reçu un reçu… » repeated « reçu ».
--  - « ce problème » could be read as the previous question's subject; the
--    question now has its own page, and « situation » is more general.

UPDATE question_translation qt
SET label = v.label
FROM (VALUES
  ('HEALTH', 'RECEIPT_GIVEN', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?'),
  ('COMMON', 'REPORTED', 'Avez-vous signalé cette situation à l''établissement (accueil, service client, direction…) ?')
) AS v (questionnaire, question, label),
question q, questionnaire qn
WHERE qn.code = v.questionnaire AND qn.version = 1
  AND q.questionnaire_id = qn.id AND q.code = v.question
  AND qt.question_id = q.id AND qt.language = 'fr';
