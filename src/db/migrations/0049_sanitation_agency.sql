-- 0049: the ONAS agency (decided by Olivia, 2026-10-09). The ONAS shared
-- « Une démarche en agence » with Sen'Eau (WATER_AGENCY, 0025), so it got
-- « Factures » and « Un branchement ou un compteur », meant for Sen'Eau. It now
-- has an agency of its own: the agency's blocks and « Simplicité de la
-- démarche », no « Factures », and its own subject question. Sen'Eau does not
-- change; the ONAS feedbacks already given keep their service.

INSERT INTO topic_set (code) VALUES ('SANITATION_AGENCY');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'SANITATION_AGENCY' AND t.code = 'PROCEDURE';

-- The subject: like AGENCY_SUBJECT, a fact that only says what the procedure was.
INSERT INTO question (code, type) VALUES ('SANITATION_SUBJECT', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Votre démarche porte sur :' FROM question WHERE code = 'SANITATION_SUBJECT';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES ('SEWER_CONNECTION', 1), ('SEPTIC_TANK', 2), ('OTHER', 3)) AS v (option, position)
JOIN question q ON q.code = 'SANITATION_SUBJECT';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('SEWER_CONNECTION', 'Un branchement à l''égout'),
  ('SEPTIC_TANK', 'Une vidange de fosse'),
  ('OTHER', 'Autre chose')
) AS v (option, label)
JOIN question q ON q.code = 'SANITATION_SUBJECT'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('SANITATION_AGENCY');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1 FROM question_set qs, question q
WHERE qs.code = 'SANITATION_AGENCY' AND q.code = 'SANITATION_SUBJECT';

-- The service, with its lists only, like the other services of the sector (0048).
INSERT INTO service (code, synonyms, replaces_shared_lists)
VALUES ('SANITATION_AGENCY', '{agence,branchement,égout,vidange,fosse,réclamation}', true);

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Une démarche en agence' FROM service WHERE code = 'SANITATION_AGENCY';

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM service s,
     (VALUES ('SANITATION_AGENCY', 1), ('STAFF_SKILLS', 2), ('COUNTER', 3), ('PREMISES', 4), ('FEES', 5)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE s.code = 'SANITATION_AGENCY';

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s, question_set qs
WHERE s.code = 'SANITATION_AGENCY' AND qs.code = 'SANITATION_AGENCY';

-- The ONAS establishments and their QR codes move to it.
UPDATE establishment_service es SET service_id = (SELECT id FROM service WHERE code = 'SANITATION_AGENCY')
FROM establishment e JOIN organization o ON o.id = e.organization_id
WHERE es.establishment_id = e.id AND o.code = 'ONAS'
  AND es.service_id = (SELECT id FROM service WHERE code = 'WATER_AGENCY');

UPDATE qr_code q SET service_id = (SELECT id FROM service WHERE code = 'SANITATION_AGENCY')
FROM establishment e JOIN organization o ON o.id = e.organization_id
WHERE q.establishment_id = e.id AND o.code = 'ONAS'
  AND q.service_id = (SELECT id FROM service WHERE code = 'WATER_AGENCY');
