-- Detailed questionnaire for health (validated 2026-10-01): facts that make
-- the topics of screen 2b precise, without asking them again. Five questions,
-- all optional, shown on one page after screen 2b. Used for every health
-- establishment (no health service is defined yet): the sector's fallback.

INSERT INTO questionnaire (code, version, status, published_at)
VALUES ('HEALTH', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position)
SELECT qn.id, v.code, v.type, v.position
FROM (VALUES
  ('PATIENT', 'single_choice', 1),
  ('GOAL_ACHIEVED', 'yes_partial_no', 2),
  ('WAIT_TIME', 'single_choice', 3),
  ('PRESCRIPTION_AVAILABLE', 'single_choice', 4),
  ('RECEIPT_GIVEN', 'single_choice', 5)
) AS v (code, type, position)
CROSS JOIN questionnaire qn
WHERE qn.code = 'HEALTH' AND qn.version = 1;

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'question', q.id, 'fr', v.label
FROM (VALUES
  ('PATIENT', 'Pour qui êtes-vous venu(e) ?'),
  ('GOAL_ACHIEVED', 'Avez-vous reçu les soins pour lesquels vous étiez venu(e) ?'),
  ('WAIT_TIME', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ('PRESCRIPTION_AVAILABLE', 'Les médicaments ou examens prescrits étaient-ils disponibles sur place ?'),
  ('RECEIPT_GIVEN', 'Avez-vous reçu un reçu pour ce que vous avez payé ?')
) AS v (code, label)
JOIN question q ON q.code = v.code
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'HEALTH' AND qn.version = 1;

-- value: an order for the results where the answers have one (more is
-- better, longer for the wait); none for who the patient was or « nothing
-- prescribed / paid ».
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('PATIENT', 'SELF', NULL, 1),
  ('PATIENT', 'CHILD', NULL, 2),
  ('PATIENT', 'OTHER_RELATIVE', NULL, 3),
  ('GOAL_ACHIEVED', 'YES', 3, 1),
  ('GOAL_ACHIEVED', 'PARTLY', 2, 2),
  ('GOAL_ACHIEVED', 'NO', 1, 3),
  ('WAIT_TIME', 'UNDER_30_MIN', 1, 1),
  ('WAIT_TIME', '30_MIN_TO_1_H', 2, 2),
  ('WAIT_TIME', '1_TO_2_H', 3, 3),
  ('WAIT_TIME', '2_TO_4_H', 4, 4),
  ('WAIT_TIME', 'OVER_4_H', 5, 5),
  ('PRESCRIPTION_AVAILABLE', 'ALL', 3, 1),
  ('PRESCRIPTION_AVAILABLE', 'SOME', 2, 2),
  ('PRESCRIPTION_AVAILABLE', 'NONE', 1, 3),
  ('PRESCRIPTION_AVAILABLE', 'NOTHING_PRESCRIBED', NULL, 4),
  ('RECEIPT_GIVEN', 'FOR_ALL', 3, 1),
  ('RECEIPT_GIVEN', 'FOR_SOME', 2, 2),
  ('RECEIPT_GIVEN', 'NO', 1, 3),
  ('RECEIPT_GIVEN', 'NOTHING_PAID', NULL, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'HEALTH' AND qn.version = 1;

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'answer_option', ao.id, 'fr', v.label
FROM (VALUES
  ('PATIENT', 'SELF', 'Pour moi'),
  ('PATIENT', 'CHILD', 'Pour mon enfant'),
  ('PATIENT', 'OTHER_RELATIVE', 'Pour un autre proche'),
  ('GOAL_ACHIEVED', 'YES', 'Oui'),
  ('GOAL_ACHIEVED', 'PARTLY', 'En partie'),
  ('GOAL_ACHIEVED', 'NO', 'Non'),
  ('WAIT_TIME', 'UNDER_30_MIN', 'Moins de 30 minutes'),
  ('WAIT_TIME', '30_MIN_TO_1_H', '30 minutes à 1 heure'),
  ('WAIT_TIME', '1_TO_2_H', '1 à 2 heures'),
  ('WAIT_TIME', '2_TO_4_H', '2 à 4 heures'),
  ('WAIT_TIME', 'OVER_4_H', 'Plus de 4 heures'),
  ('PRESCRIPTION_AVAILABLE', 'ALL', 'Oui, tous'),
  ('PRESCRIPTION_AVAILABLE', 'SOME', 'Une partie'),
  ('PRESCRIPTION_AVAILABLE', 'NONE', 'Non, aucun'),
  ('PRESCRIPTION_AVAILABLE', 'NOTHING_PRESCRIBED', 'Rien n''a été prescrit'),
  ('RECEIPT_GIVEN', 'FOR_ALL', 'Oui, pour tout'),
  ('RECEIPT_GIVEN', 'FOR_SOME', 'Pour une partie'),
  ('RECEIPT_GIVEN', 'NO', 'Non'),
  ('RECEIPT_GIVEN', 'NOTHING_PAID', 'Je n''ai rien payé')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'HEALTH' AND qn.version = 1
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

UPDATE sector
SET fallback_questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'HEALTH' AND version = 1)
WHERE code = 'HEALTH';
