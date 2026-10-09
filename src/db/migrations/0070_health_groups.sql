-- 0070: three health forms instead of one (decided by Olivia, 2026-10-09,
-- /mnt/project-files/questionnaire/validation-sante.md):
--   care (hospital, clinic, health centre, health post, medical office): the
--     sector's form until now, unchanged;
--   pharmacy: medicines in stock, the pharmacist's advice, the prices; why one
--     came, then the advice after « Sans ordonnance »; medicines found and
--     dosage explained;
--   tests (laboratory, imaging centre): results' delay and quality; test done
--     on the planned day, results received.
-- The sector keeps what the three share (COUNTER, PREMISES); the rest of its
-- lists go to the care types. A sector's list marked only_without_type (new,
-- like only_without_service in 0053) goes only to an establishment without a
-- type (« Autre » when a user adds it): a health one keeps the care form
-- (decided by Olivia, 2026-10-09).

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('MEDICINES_IN_STOCK', 1, 'OUTCOME'),
  ('PHARMACIST_ADVICE', 2, 'STAFF'),
  ('MEDICINE_PRICES', 3, 'COST'),
  ('RESULTS_DELAY', 4, 'DELAYS'),
  ('RESULTS_QUALITY', 5, 'OUTCOME')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('MEDICINES_IN_STOCK', 'Médicaments disponibles'),
  ('PHARMACIST_ADVICE', 'Conseils du pharmacien (choix du médicament, posologie, effets)'),
  ('MEDICINE_PRICES', 'Prix des médicaments (affichés et respectés)'),
  ('RESULTS_DELAY', 'Délai des résultats (respecté)'),
  ('RESULTS_QUALITY', 'Résultats (lisibles, complets, sans erreur)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('PHARMACY'), ('MEDICAL_TESTS');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('PHARMACY', 'MEDICINES_IN_STOCK'), ('PHARMACY', 'PHARMACIST_ADVICE'), ('PHARMACY', 'MEDICINE_PRICES'),
  ('PHARMACY', 'PROFESSIONALISM'),
  ('MEDICAL_TESTS', 'RESULTS_DELAY'), ('MEDICAL_TESTS', 'RESULTS_QUALITY'), ('MEDICAL_TESTS', 'PRIVACY')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- Why one came is a fact (no category).
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES
  ('PHARMACY_VISIT_REASON', NULL), ('PHARMACIST_ADVICE_GIVEN', 'STAFF'), ('MEDICINES_FOUND', 'OUTCOME'),
  ('DOSAGE_EXPLAINED', 'STAFF'), ('TEST_ON_SCHEDULE', 'DELAYS'), ('RESULTS_RECEIVED', 'DELAYS')
) AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('PHARMACY_VISIT_REASON', 'Vous êtes venu(e) :'),
  ('PHARMACIST_ADVICE_GIVEN', 'Le pharmacien vous a-t-il conseillé un médicament adapté à votre problème ?'),
  ('MEDICINES_FOUND', 'Avez-vous trouvé tous vos médicaments ?'),
  ('DOSAGE_EXPLAINED', 'Vous a-t-on expliqué comment prendre vos médicaments ?'),
  ('TEST_ON_SCHEDULE', 'Avez-vous pu faire l''examen le jour prévu ?'),
  ('RESULTS_RECEIVED', 'Avez-vous reçu vos résultats ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- Valued like the other outcomes; « not needed » has no value.
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('PHARMACY_VISIT_REASON', 'PRESCRIPTION', NULL::int, 1), ('PHARMACY_VISIT_REASON', 'NO_PRESCRIPTION', NULL, 2),
  ('PHARMACY_VISIT_REASON', 'OTHER_PURCHASE', NULL, 3),
  ('PHARMACIST_ADVICE_GIVEN', 'YES', 3, 1), ('PHARMACIST_ADVICE_GIVEN', 'PARTLY', 2, 2),
  ('PHARMACIST_ADVICE_GIVEN', 'NO', 1, 3),
  ('MEDICINES_FOUND', 'ALL', 3, 1), ('MEDICINES_FOUND', 'SOME', 2, 2), ('MEDICINES_FOUND', 'NONE', 1, 3),
  ('DOSAGE_EXPLAINED', 'YES', 2, 1), ('DOSAGE_EXPLAINED', 'NO', 1, 2), ('DOSAGE_EXPLAINED', 'NOT_NEEDED', NULL, 3),
  ('TEST_ON_SCHEDULE', 'YES', 2, 1), ('TEST_ON_SCHEDULE', 'POSTPONED', 1, 2),
  ('RESULTS_RECEIVED', 'ON_TIME', 3, 1), ('RESULTS_RECEIVED', 'LATE', 2, 2), ('RESULTS_RECEIVED', 'NOT_YET', NULL, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('PHARMACY_VISIT_REASON', 'PRESCRIPTION', 'Avec une ordonnance'),
  ('PHARMACY_VISIT_REASON', 'NO_PRESCRIPTION', 'Sans ordonnance, pour un petit problème de santé'),
  ('PHARMACY_VISIT_REASON', 'OTHER_PURCHASE', 'Pour un autre achat'),
  ('PHARMACIST_ADVICE_GIVEN', 'YES', 'Oui'), ('PHARMACIST_ADVICE_GIVEN', 'PARTLY', 'En partie'),
  ('PHARMACIST_ADVICE_GIVEN', 'NO', 'Non'),
  ('MEDICINES_FOUND', 'ALL', 'Oui, tous'), ('MEDICINES_FOUND', 'SOME', 'Une partie'),
  ('MEDICINES_FOUND', 'NONE', 'Non, aucun'),
  ('DOSAGE_EXPLAINED', 'YES', 'Oui'), ('DOSAGE_EXPLAINED', 'NO', 'Non'),
  ('DOSAGE_EXPLAINED', 'NOT_NEEDED', 'Je n''en avais pas besoin'),
  ('TEST_ON_SCHEDULE', 'YES', 'Oui'),
  ('TEST_ON_SCHEDULE', 'POSTPONED', 'Non, il a été reporté (appareil en panne, produit manquant)'),
  ('RESULTS_RECEIVED', 'ON_TIME', 'Oui, dans le délai annoncé'), ('RESULTS_RECEIVED', 'LATE', 'Oui, mais en retard'),
  ('RESULTS_RECEIVED', 'NOT_YET', 'Pas encore')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('PHARMACY'), ('MEDICAL_TESTS');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('PHARMACY', 'PATIENT', 1), ('PHARMACY', 'PHARMACY_VISIT_REASON', 2), ('PHARMACY', 'PHARMACIST_ADVICE_GIVEN', 3),
  ('PHARMACY', 'MEDICINES_FOUND', 4), ('PHARMACY', 'DOSAGE_EXPLAINED', 5),
  ('MEDICAL_TESTS', 'PATIENT', 1), ('MEDICAL_TESTS', 'TEST_ON_SCHEDULE', 2), ('MEDICAL_TESTS', 'RESULTS_RECEIVED', 3),
  ('MEDICAL_TESTS', 'WAIT_TIME', 4)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM question_set qs, question q, question d
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = 'NO_PRESCRIPTION'
WHERE qs.code = 'PHARMACY' AND q.code = 'PHARMACIST_ADVICE_GIVEN' AND d.code = 'PHARMACY_VISIT_REASON';

-- ---------------------------------------------------------------------------
-- The lists of each type
-- ---------------------------------------------------------------------------
ALTER TABLE sector_topic_set ADD COLUMN only_without_type boolean NOT NULL DEFAULT false;
ALTER TABLE sector_question_set ADD COLUMN only_without_type boolean NOT NULL DEFAULT false;

UPDATE sector_topic_set SET only_without_type = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'HEALTH')
  AND topic_set_id IN (SELECT id FROM topic_set WHERE code IN ('HEALTH', 'STAFF_SKILLS', 'FEES'));

UPDATE sector_question_set SET only_without_type = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'HEALTH');

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, v.position
FROM establishment_type et,
     (VALUES ('HEALTH', 1), ('STAFF_SKILLS', 2), ('FEES', 3)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE et.code IN ('HOSPITAL', 'CLINIC', 'HEALTH_CENTER', 'HEALTH_POST', 'MEDICAL_OFFICE')
UNION ALL
SELECT et.id, ts.id, 1 FROM establishment_type et, topic_set ts
WHERE et.code = 'PHARMACY' AND ts.code = 'PHARMACY'
UNION ALL
SELECT et.id, ts.id, v.position
FROM establishment_type et,
     (VALUES ('MEDICAL_TESTS', 1), ('STAFF_SKILLS', 2), ('FEES', 3)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE et.code IN ('MEDICAL_LABORATORY', 'MEDICAL_IMAGING_CENTER');

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT et.id, qs.id, v.position
FROM establishment_type et,
     (VALUES ('HEALTH', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE et.code IN ('HOSPITAL', 'CLINIC', 'HEALTH_CENTER', 'HEALTH_POST', 'MEDICAL_OFFICE')
UNION ALL
SELECT et.id, qs.id, 1 FROM establishment_type et, question_set qs
WHERE et.code = 'PHARMACY' AND qs.code = 'PHARMACY'
UNION ALL
SELECT et.id, qs.id, v.position
FROM establishment_type et,
     (VALUES ('MEDICAL_TESTS', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE et.code IN ('MEDICAL_LABORATORY', 'MEDICAL_IMAGING_CENTER');
