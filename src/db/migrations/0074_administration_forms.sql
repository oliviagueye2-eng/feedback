-- 0074: the administration forms (decided by Olivia, 2026-10-10,
-- /mnt/project-files/questionnaire/validation-administration.md):
--   identity card, passport, driving licence: the appointment, and whether the
--     document was ready on the announced date;
--   civil registry (the town hall's path and the civil registry centre):
--     whether the certificate handed over was correct.

INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('DOCUMENT_READY', 'DELAYS'), ('CERTIFICATE_CORRECT', 'OUTCOME')) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('DOCUMENT_READY', 'Votre document était-il prêt à la date annoncée ?'),
  ('CERTIFICATE_CORRECT', 'L''acte remis était-il correct (noms, dates) ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- « Pas encore la date » and « Je ne l'ai pas encore » carry no value.
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('DOCUMENT_READY', 'YES', 2, 1), ('DOCUMENT_READY', 'NO', 1, 2), ('DOCUMENT_READY', 'NOT_YET', NULL::int, 3),
  ('CERTIFICATE_CORRECT', 'YES', 2, 1), ('CERTIFICATE_CORRECT', 'CORRECTED', 1, 2),
  ('CERTIFICATE_CORRECT', 'NOT_YET', NULL, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('DOCUMENT_READY', 'YES', 'Oui'), ('DOCUMENT_READY', 'NO', 'Non'),
  ('DOCUMENT_READY', 'NOT_YET', 'Pas encore la date'),
  ('CERTIFICATE_CORRECT', 'YES', 'Oui'), ('CERTIFICATE_CORRECT', 'CORRECTED', 'Non, il a fallu le faire corriger'),
  ('CERTIFICATE_CORRECT', 'NOT_YET', 'Je ne l''ai pas encore')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- Lists
-- ---------------------------------------------------------------------------
INSERT INTO topic_set (code) VALUES ('ID_DOCUMENTS');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'ID_DOCUMENTS' AND t.code = 'APPOINTMENT';

INSERT INTO question_set (code) VALUES ('ID_DOCUMENTS'), ('CIVIL_REGISTRY');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1
FROM (VALUES ('ID_DOCUMENTS', 'DOCUMENT_READY'), ('CIVIL_REGISTRY', 'CERTIFICATE_CORRECT')) AS v (list, question)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, 1 FROM establishment_type et, topic_set ts
WHERE et.code IN ('ID_DOCUMENT_CENTER', 'DRIVING_LICENCE_CENTER') AND ts.code = 'ID_DOCUMENTS';

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT et.id, qs.id, v.position
FROM (VALUES ('ID_DOCUMENT_CENTER', 'ID_DOCUMENTS', 1), ('DRIVING_LICENCE_CENTER', 'ID_DOCUMENTS', 3),
             ('CIVIL_REGISTRY_CENTER', 'CIVIL_REGISTRY', 1)) AS v (type, list, position)
JOIN establishment_type et ON et.code = v.type
JOIN question_set qs ON qs.code = v.list;

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s, question_set qs
WHERE s.code = 'CIVIL_REGISTRY' AND qs.code = 'CIVIL_REGISTRY';
