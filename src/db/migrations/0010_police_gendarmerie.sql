-- The police and the gendarmerie (validated on 2026-10-03,
-- /mnt/project-files/questionnaire/police-gendarmerie.md). Two visits that do
-- not compare: a procedure at the station (a complaint, a lost paper, a
-- certificate, a summons), and a check or an intervention outside (a road
-- check, a roadblock, a call for help). One service each, chosen on screen 1
-- like the schools' (0009); each brings its own topics and questions.

-- ---------------------------------------------------------------------------
-- The two organisations, rated « in general » like Air Sénégal (0006)
-- ---------------------------------------------------------------------------
-- After a road check, the user rarely knows which station the officer belongs
-- to. The stations and brigades (sites with a QR code) will come later, with
-- real addresses.
INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM (VALUES
  ('POLICE_NATIONALE', 'Police nationale', 'Direction générale de la Police nationale'),
  ('GENDARMERIE_NATIONALE', 'Gendarmerie nationale', 'Haut-Commandement de la Gendarmerie nationale')
) AS v (code, name, full_name)
JOIN sector s ON s.code = 'SECURITY';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases::text[], o.id, 'general', o.sector_id
FROM (VALUES
  ('POLICE_NATIONALE', '{Direction générale de la Police nationale,DGPN,police,policier,commissariat}'),
  ('GENDARMERIE_NATIONALE', '{Haut-Commandement de la Gendarmerie nationale,gendarmerie,gendarme,brigade}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
-- « Propreté, entretien et confort » and « Accessibilité » rate premises, not a
-- road check: they leave the COMMON list for every list a sector uses, and
-- for the visit at the station. Nothing changes on screen for the other places
-- (the Education sector gets them back through a list of its own, which every
-- education type adds to its own).
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'COMMON')
  AND topic_id IN (SELECT id FROM topic WHERE code IN ('CLEANLINESS', 'ACCESS_FOR_ALL'));

INSERT INTO topic_set (code) VALUES ('EDUCATION'), ('POLICE_PREMISES'), ('POLICE_FIELD');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM topic_set s, topic t
WHERE s.code IN ('GENERIC', 'FILE_SERVICES', 'BANKING_INSURANCE', 'ELECTRICITY', 'WATER', 'TELECOM',
                 'HEALTH', 'REAL_ESTATE', 'TRANSPORT', 'EDUCATION', 'POLICE_PREMISES')
  AND t.code IN ('CLEANLINESS', 'ACCESS_FOR_ALL');

UPDATE sector SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'EDUCATION') WHERE code = 'EDUCATION';

-- The Security list keeps what both visits share (the staff, the rights, the
-- request); the rest of the counter goes to the visit at the station, and the
-- time the officers took to come to the visit outside.
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'SECURITY')
  AND topic_id NOT IN (SELECT id FROM topic WHERE code IN ('STAFF', 'INFORMATION', 'RIGHTS_RESPECT', 'REQUEST_HANDLING'));

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('POLICE_PREMISES', 'WAIT_TIME'), ('POLICE_PREMISES', 'PROCESSING_TIME'), ('POLICE_PREMISES', 'PROCEDURE'),
  ('POLICE_PREMISES', 'CASE_TRACKING'), ('POLICE_PREMISES', 'OPENING_HOURS'), ('POLICE_PREMISES', 'FEES'),
  ('POLICE_FIELD', 'INTERVENTION_TIME')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type, category_id)
SELECT v.code, v.type, c.id
FROM (VALUES
  ('POLICE_VISIT_REASON', 'single_choice', NULL),
  ('STATEMENT_RECEIPT', 'single_choice', 'PROCEDURE'),
  ('FIELD_SITUATION', 'single_choice', NULL),
  ('REASON_EXPLAINED', 'yes_partial_no', 'STAFF'),
  ('ARRIVAL_TIME', 'single_choice', 'DELAYS')
) AS v (code, type, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('POLICE_VISIT_REASON', 'Pourquoi êtes-vous venu(e) ?'),
  ('STATEMENT_RECEIPT', 'Vous a-t-on remis un récépissé ou une copie de votre déclaration ?'),
  ('FIELD_SITUATION', 'De quoi s''agissait-il ?'),
  ('REASON_EXPLAINED', 'L''agent vous a-t-il expliqué la raison du contrôle ou de l''intervention ?'),
  ('ARRIVAL_TIME', 'Combien de temps les agents ont-ils mis pour arriver ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('POLICE_VISIT_REASON', 'COMPLAINT', NULL, 1),
  ('POLICE_VISIT_REASON', 'LOSS', NULL, 2),
  ('POLICE_VISIT_REASON', 'DOCUMENT', NULL, 3),
  ('POLICE_VISIT_REASON', 'SUMMONS', NULL, 4),
  ('POLICE_VISIT_REASON', 'OTHER', NULL, 5),
  ('STATEMENT_RECEIPT', 'YES', 2, 1),
  ('STATEMENT_RECEIPT', 'NO', 1, 2),
  ('FIELD_SITUATION', 'ROAD_CHECK', NULL, 1),
  ('FIELD_SITUATION', 'CALL_RESPONSE', NULL, 2),
  ('FIELD_SITUATION', 'ARREST', NULL, 3),
  ('FIELD_SITUATION', 'OTHER', NULL, 4),
  ('REASON_EXPLAINED', 'YES', 3, 1),
  ('REASON_EXPLAINED', 'PARTLY', 2, 2),
  ('REASON_EXPLAINED', 'NO', 1, 3),
  -- Longer is worse, like the waits; not coming is the worst.
  ('ARRIVAL_TIME', 'UNDER_15_MIN', 1, 1),
  ('ARRIVAL_TIME', '15_TO_30_MIN', 2, 2),
  ('ARRIVAL_TIME', '30_MIN_TO_1_H', 3, 3),
  ('ARRIVAL_TIME', 'OVER_1_H', 4, 4),
  ('ARRIVAL_TIME', 'NEVER_CAME', 5, 5)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM (VALUES
  ('POLICE_VISIT_REASON', 'COMPLAINT', 'Porter plainte ou signaler un fait'),
  ('POLICE_VISIT_REASON', 'LOSS', 'Déclarer une perte'),
  ('POLICE_VISIT_REASON', 'DOCUMENT', 'Demander un certificat ou un document'),
  ('POLICE_VISIT_REASON', 'SUMMONS', 'Répondre à une convocation'),
  ('POLICE_VISIT_REASON', 'OTHER', 'Autre'),
  ('STATEMENT_RECEIPT', 'YES', 'Oui'),
  ('STATEMENT_RECEIPT', 'NO', 'Non'),
  ('FIELD_SITUATION', 'ROAD_CHECK', 'Un contrôle routier ou de papiers'),
  ('FIELD_SITUATION', 'CALL_RESPONSE', 'Une intervention après un appel'),
  ('FIELD_SITUATION', 'ARREST', 'Une interpellation'),
  ('FIELD_SITUATION', 'OTHER', 'Autre'),
  ('REASON_EXPLAINED', 'YES', 'Oui'),
  ('REASON_EXPLAINED', 'PARTLY', 'En partie'),
  ('REASON_EXPLAINED', 'NO', 'Non'),
  ('ARRIVAL_TIME', 'UNDER_15_MIN', 'Moins de 15 minutes'),
  ('ARRIVAL_TIME', '15_TO_30_MIN', '15 à 30 minutes'),
  ('ARRIVAL_TIME', '30_MIN_TO_1_H', '30 minutes à 1 heure'),
  ('ARRIVAL_TIME', 'OVER_1_H', 'Plus d''une heure'),
  ('ARRIVAL_TIME', 'NEVER_CAME', 'Ils ne sont pas venus')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

-- « Un reçu pour ce que vous avez payé ? » is the existing question, also asked
-- outside (a fine). « Vous a-t-on demandé de l'argent sans reçu ? » stays out
-- (too sensitive without the body behind the platform): the receipt tells the
-- same without accusing.
INSERT INTO question_set (code) VALUES ('POLICE_PREMISES'), ('POLICE_FIELD');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('POLICE_PREMISES', 'POLICE_VISIT_REASON', 1),
  ('POLICE_PREMISES', 'GOAL_ACHIEVED', 2),
  ('POLICE_PREMISES', 'WAIT_TIME', 3),
  ('POLICE_PREMISES', 'VISITS_COUNT', 4),
  ('POLICE_PREMISES', 'STATEMENT_RECEIPT', 5),
  ('POLICE_PREMISES', 'RECEIPT_GIVEN', 6),
  ('POLICE_FIELD', 'FIELD_SITUATION', 1),
  ('POLICE_FIELD', 'REASON_EXPLAINED', 2),
  ('POLICE_FIELD', 'ARRIVAL_TIME', 3),
  ('POLICE_FIELD', 'RECEIPT_GIVEN', 4)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- The receipt of a statement only after a complaint or a lost paper; the time
-- to come only after a call.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('POLICE_PREMISES', 'STATEMENT_RECEIPT', 'POLICE_VISIT_REASON', 'COMPLAINT'),
  ('POLICE_PREMISES', 'STATEMENT_RECEIPT', 'POLICE_VISIT_REASON', 'LOSS'),
  ('POLICE_FIELD', 'ARRIVAL_TIME', 'FIELD_SITUATION', 'CALL_RESPONSE')
) AS v (list, question, depends_on, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question
JOIN question dq ON dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- The two services
-- ---------------------------------------------------------------------------
-- Offered by both organisations and by every station, post or brigade.
INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[]
FROM (VALUES
  ('POLICE_PREMISES', '{plainte,déclaration de perte,perte,certificat de résidence,certificat,convocation,procès-verbal}'),
  ('POLICE_FIELD', '{contrôle routier,contrôle,barrage,intervention,interpellation,patrouille}')
) AS v (code, synonyms)
JOIN sector s ON s.code = 'SECURITY'
JOIN topic_set ts ON ts.code = v.code
JOIN question_set qs ON qs.code = v.code;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('POLICE_PREMISES', 'Une démarche dans les locaux'),
  ('POLICE_FIELD', 'Un contrôle ou une intervention sur le terrain')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
LEFT JOIN establishment_type et ON et.id = e.type_id
LEFT JOIN organization o ON o.id = e.organization_id
JOIN service s ON s.code IN ('POLICE_PREMISES', 'POLICE_FIELD')
WHERE et.code IN ('POLICE_STATION', 'POLICE_POST', 'GENDARMERIE_BRIGADE')
   OR o.code IN ('POLICE_NATIONALE', 'GENDARMERIE_NATIONALE');
