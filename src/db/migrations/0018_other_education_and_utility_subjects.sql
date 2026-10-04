-- Validated on 2026-10-04 (« Un oui, trois oui »).
--
-- 1. The training centres, the preschools and the daaras are rated for the
-- two visits of the schools (0009, 0014): « Inscription ou démarche
-- administrative » and « Les cours et la vie de l'école », with their topics
-- and questions. Their old shared list (OTHER_EDUCATION) goes.
-- At a preschool, the child does not answer: « Vous êtes : » offers only
-- « Parent » and « Autre ». « Vous êtes » moves from the Education sector to
-- the types, so the preschool can have its own.
--
-- 3. Electricity, water and telecoms ask about cuts and the network only to
-- those who came about them: the cuts after « Une coupure », the Woyofal meter
-- after « Une facture » or « Un branchement ou un compteur », the network lost
-- after calls, mobile internet or home internet.
--
-- (2, the topics repeating a question, stays as is: the topic is seen before
-- the questions, by those who stop there too.)

-- ---------------------------------------------------------------------------
-- 1. Training centres, preschools, daaras
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type) VALUES ('PRESCHOOL_RESPONDENT', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Vous êtes :' FROM question WHERE code = 'PRESCHOOL_RESPONDENT';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES ('PARENT', 1), ('OTHER', 2)) AS v (option, position)
JOIN question q ON q.code = 'PRESCHOOL_RESPONDENT';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES ('PARENT', 'Parent'), ('OTHER', 'Autre')) AS v (option, label)
JOIN question q ON q.code = 'PRESCHOOL_RESPONDENT'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('PRESCHOOL');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1 FROM question_set qs, question q
WHERE qs.code = 'PRESCHOOL' AND q.code = 'PRESCHOOL_RESPONDENT';

-- « Vous êtes » (the Education list) on every education type but the preschool.
UPDATE establishment_type et SET topic_set_id = NULL, question_set_id = qs.id
FROM question_set qs, sector s
WHERE qs.code = 'EDUCATION' AND s.code = 'EDUCATION' AND et.sector_id = s.id AND et.code <> 'PRESCHOOL';

UPDATE establishment_type et SET topic_set_id = NULL, question_set_id = qs.id
FROM question_set qs
WHERE qs.code = 'PRESCHOOL' AND et.code = 'PRESCHOOL';

UPDATE sector SET question_set_id = NULL WHERE code = 'EDUCATION';

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN establishment_type et ON et.id = e.type_id
  AND et.code IN ('VOCATIONAL_TRAINING_CENTER', 'PRESCHOOL', 'DAARA')
JOIN service s ON s.code IN ('SCHOOL_ADMIN', 'SCHOOL_LIFE')
ON CONFLICT DO NOTHING;

DELETE FROM question_condition WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'OTHER_EDUCATION');
DELETE FROM question_set_item WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'OTHER_EDUCATION');
DELETE FROM question_set WHERE code = 'OTHER_EDUCATION';
DELETE FROM topic_set_item WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'OTHER_EDUCATION');
DELETE FROM topic_set WHERE code = 'OTHER_EDUCATION';

-- ---------------------------------------------------------------------------
-- 3. Questions of the networks after the subject chosen
-- ---------------------------------------------------------------------------
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('ELECTRICITY', 'CUTS_COUNT', 'UTILITY_SUBJECT', 'CUT'),
  ('ELECTRICITY', 'PREPAID_METER', 'UTILITY_SUBJECT', 'BILL'),
  ('ELECTRICITY', 'PREPAID_METER', 'UTILITY_SUBJECT', 'CONNECTION'),
  ('WATER', 'DAYS_WITHOUT_WATER', 'UTILITY_SUBJECT', 'CUT'),
  ('TELECOM', 'NETWORK_LOSS', 'TELECOM_SUBJECT', 'CALLS_SMS'),
  ('TELECOM', 'NETWORK_LOSS', 'TELECOM_SUBJECT', 'MOBILE_INTERNET'),
  ('TELECOM', 'NETWORK_LOSS', 'TELECOM_SUBJECT', 'HOME_INTERNET')
) AS v (question_set, question, depends_on, option)
JOIN question_set qs ON qs.code = v.question_set
JOIN question q ON q.code = v.question
JOIN question dq ON dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;
