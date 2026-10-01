-- Detailed questionnaire for « Administration et état civil » (validated
-- 2026-10-01): five facts, all optional, on screen 6. Used for every
-- establishment of the sector (fallback), the town halls' « État civil »
-- included. Same codes and answers as health where the question is the same
-- (GOAL_ACHIEVED, WAIT_TIME, RECEIPT_GIVEN), so the sectors can be compared.

INSERT INTO questionnaire (code, version, status, published_at)
VALUES ('ADMINISTRATION', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position)
SELECT qn.id, v.code, v.type, v.position
FROM (VALUES
  ('GOAL_ACHIEVED', 'yes_partial_no', 1),
  ('VISITS_COUNT', 'single_choice', 2),
  ('WAIT_TIME', 'single_choice', 3),
  ('DOCUMENTS_KNOWN', 'yes_partial_no', 4),
  ('RECEIPT_GIVEN', 'single_choice', 5)
) AS v (code, type, position)
CROSS JOIN questionnaire qn
WHERE qn.code = 'ADMINISTRATION' AND qn.version = 1;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('GOAL_ACHIEVED', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ('VISITS_COUNT', 'Combien de fois êtes-vous venu(e) pour cette démarche ?'),
  ('WAIT_TIME', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ('DOCUMENTS_KNOWN', 'Saviez-vous à l''avance quels papiers apporter ?'),
  ('RECEIPT_GIVEN', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?')
) AS v (code, label)
JOIN question q ON q.code = v.code
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'ADMINISTRATION' AND qn.version = 1;

-- value: an order for the results (more is better; more visits or a longer
-- wait are worse), none for « nothing paid ».
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('GOAL_ACHIEVED', 'YES', 3, 1),
  ('GOAL_ACHIEVED', 'PARTLY', 2, 2),
  ('GOAL_ACHIEVED', 'NO', 1, 3),
  ('VISITS_COUNT', 'ONCE', 1, 1),
  ('VISITS_COUNT', 'TWICE', 2, 2),
  ('VISITS_COUNT', 'THREE_OR_MORE', 3, 3),
  ('WAIT_TIME', 'UNDER_30_MIN', 1, 1),
  ('WAIT_TIME', '30_MIN_TO_1_H', 2, 2),
  ('WAIT_TIME', '1_TO_2_H', 3, 3),
  ('WAIT_TIME', '2_TO_4_H', 4, 4),
  ('WAIT_TIME', 'OVER_4_H', 5, 5),
  ('DOCUMENTS_KNOWN', 'YES', 3, 1),
  ('DOCUMENTS_KNOWN', 'PARTLY', 2, 2),
  ('DOCUMENTS_KNOWN', 'NO', 1, 3),
  ('RECEIPT_GIVEN', 'FOR_ALL', 3, 1),
  ('RECEIPT_GIVEN', 'FOR_SOME', 2, 2),
  ('RECEIPT_GIVEN', 'NO', 1, 3),
  ('RECEIPT_GIVEN', 'NOTHING_PAID', NULL, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'ADMINISTRATION' AND qn.version = 1;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('GOAL_ACHIEVED', 'YES', 'Oui'),
  ('GOAL_ACHIEVED', 'PARTLY', 'En partie'),
  ('GOAL_ACHIEVED', 'NO', 'Non'),
  ('VISITS_COUNT', 'ONCE', '1 fois'),
  ('VISITS_COUNT', 'TWICE', '2 fois'),
  ('VISITS_COUNT', 'THREE_OR_MORE', '3 fois ou plus'),
  ('WAIT_TIME', 'UNDER_30_MIN', 'Moins de 30 minutes'),
  ('WAIT_TIME', '30_MIN_TO_1_H', '30 minutes à 1 heure'),
  ('WAIT_TIME', '1_TO_2_H', '1 à 2 heures'),
  ('WAIT_TIME', '2_TO_4_H', '2 à 4 heures'),
  ('WAIT_TIME', 'OVER_4_H', 'Plus de 4 heures'),
  ('DOCUMENTS_KNOWN', 'YES', 'Oui'),
  ('DOCUMENTS_KNOWN', 'PARTLY', 'En partie'),
  ('DOCUMENTS_KNOWN', 'NO', 'Non'),
  ('RECEIPT_GIVEN', 'FOR_ALL', 'Oui, pour tout'),
  ('RECEIPT_GIVEN', 'FOR_SOME', 'Pour une partie'),
  ('RECEIPT_GIVEN', 'NO', 'Non'),
  ('RECEIPT_GIVEN', 'NOTHING_PAID', 'Je n''ai rien payé')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'ADMINISTRATION' AND qn.version = 1
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

UPDATE sector
SET fallback_questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ADMINISTRATION' AND version = 1)
WHERE code = 'ADMINISTRATION';
