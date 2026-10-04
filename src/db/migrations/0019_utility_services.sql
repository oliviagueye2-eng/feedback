-- Senelec and Sen'Eau (validated on 2026-10-04,
-- /mnt/project-files/questionnaire/senelec-seneau.md). Two visits that do not
-- compare: a procedure at an agency (a bill, a connection, a meter), and the
-- electricity or the water at home (the cuts, the quality). One service each,
-- chosen on screen 1 like the police's (0010); each brings its own topics and
-- questions. The lists of the Electricity and Water sectors are shared out
-- between them: the sectors keep none.

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic_set (code) VALUES ('UTILITY_AGENCY'), ('ELECTRICITY_SUPPLY'), ('WATER_SUPPLY');

-- « Délai d'intervention » is new for the water.
INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('UTILITY_AGENCY', 'STAFF'), ('UTILITY_AGENCY', 'INFORMATION'), ('UTILITY_AGENCY', 'WAIT_TIME'),
  ('UTILITY_AGENCY', 'PROCEDURE'), ('UTILITY_AGENCY', 'OPENING_HOURS'), ('UTILITY_AGENCY', 'FEES'),
  ('UTILITY_AGENCY', 'BILLING'), ('UTILITY_AGENCY', 'CLEANLINESS'), ('UTILITY_AGENCY', 'ACCESS_FOR_ALL'),
  ('ELECTRICITY_SUPPLY', 'POWER_CUTS'), ('ELECTRICITY_SUPPLY', 'INTERVENTION_TIME'),
  ('ELECTRICITY_SUPPLY', 'CUSTOMER_SERVICE'),
  ('WATER_SUPPLY', 'WATER_CUTS'), ('WATER_SUPPLY', 'WATER_QUALITY'), ('WATER_SUPPLY', 'INTERVENTION_TIME'),
  ('WATER_SUPPLY', 'CUSTOMER_SERVICE')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

DELETE FROM topic_set_item
WHERE topic_set_id IN (SELECT id FROM topic_set WHERE code IN ('ELECTRICITY', 'WATER'));

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- The agency's subject: « Votre avis porte surtout sur » without « Une
-- coupure ». The old question stays in the bank for the answers already given.
INSERT INTO question (code, type) VALUES ('AGENCY_SUBJECT', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Votre démarche porte sur :' FROM question WHERE code = 'AGENCY_SUBJECT';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES ('BILL', 1), ('CONNECTION', 2), ('OTHER', 3)) AS v (option, position)
JOIN question q ON q.code = 'AGENCY_SUBJECT';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('BILL', 'Une facture'),
  ('CONNECTION', 'Un branchement ou un compteur'),
  ('OTHER', 'Autre chose')
) AS v (option, label)
JOIN question q ON q.code = 'AGENCY_SUBJECT'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES
  ('ELECTRICITY_AGENCY'), ('WATER_AGENCY'), ('ELECTRICITY_SUPPLY'), ('WATER_SUPPLY');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('ELECTRICITY_AGENCY', 'AGENCY_SUBJECT', 1),
  ('ELECTRICITY_AGENCY', 'PREPAID_METER', 2),
  ('WATER_AGENCY', 'AGENCY_SUBJECT', 1),
  ('ELECTRICITY_SUPPLY', 'CUTS_COUNT', 1),
  ('ELECTRICITY_SUPPLY', 'CUT_NOTICE', 2),
  ('WATER_SUPPLY', 'DAYS_WITHOUT_WATER', 1),
  ('WATER_SUPPLY', 'CUT_NOTICE', 2)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- The Woyofal meter after a bill or a connection (0018); « prévenu(e) » only
-- to those who had cuts (0011).
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('ELECTRICITY_AGENCY', 'PREPAID_METER', 'AGENCY_SUBJECT', 'BILL'),
  ('ELECTRICITY_AGENCY', 'PREPAID_METER', 'AGENCY_SUBJECT', 'CONNECTION'),
  ('ELECTRICITY_SUPPLY', 'CUT_NOTICE', 'CUTS_COUNT', '1_TO_3'),
  ('ELECTRICITY_SUPPLY', 'CUT_NOTICE', 'CUTS_COUNT', '4_TO_10'),
  ('ELECTRICITY_SUPPLY', 'CUT_NOTICE', 'CUTS_COUNT', 'OVER_10'),
  ('WATER_SUPPLY', 'CUT_NOTICE', 'DAYS_WITHOUT_WATER', '1_TO_3'),
  ('WATER_SUPPLY', 'CUT_NOTICE', 'DAYS_WITHOUT_WATER', '4_TO_10'),
  ('WATER_SUPPLY', 'CUT_NOTICE', 'DAYS_WITHOUT_WATER', 'OVER_10')
) AS v (list, question, depends_on, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question
JOIN question dq ON dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;

-- The sectors' lists go: the subject question is replaced by the service.
UPDATE sector SET question_set_id = NULL WHERE code IN ('ELECTRICITY', 'WATER');
DELETE FROM question_condition WHERE question_set_id IN (SELECT id FROM question_set WHERE code IN ('ELECTRICITY', 'WATER'));
DELETE FROM question_set_item WHERE question_set_id IN (SELECT id FROM question_set WHERE code IN ('ELECTRICITY', 'WATER'));
DELETE FROM question_set WHERE code IN ('ELECTRICITY', 'WATER');

-- ---------------------------------------------------------------------------
-- The services
-- ---------------------------------------------------------------------------
-- The agency is one service per sector, so a Sen'Eau feedback stays in Water.
INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[]
FROM (VALUES
  ('ELECTRICITY_AGENCY', 'ELECTRICITY', 'UTILITY_AGENCY', '{agence,facture,branchement,compteur,Woyofal,abonnement,réclamation}'),
  ('ELECTRICITY_SUPPLY', 'ELECTRICITY', 'ELECTRICITY_SUPPLY', '{coupure,délestage,courant,électricité,panne}'),
  ('WATER_AGENCY', 'WATER', 'UTILITY_AGENCY', '{agence,facture,branchement,compteur,abonnement,réclamation}'),
  ('WATER_SUPPLY', 'WATER', 'WATER_SUPPLY', '{coupure d''eau,eau,robinet,pression,qualité de l''eau,fuite}')
) AS v (code, sector, topic_set, synonyms)
JOIN sector s ON s.code = v.sector
JOIN topic_set ts ON ts.code = v.topic_set
JOIN question_set qs ON qs.code = v.code;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('ELECTRICITY_AGENCY', 'Une démarche en agence'),
  ('ELECTRICITY_SUPPLY', 'Le courant chez vous'),
  ('WATER_AGENCY', 'Une démarche en agence'),
  ('WATER_SUPPLY', 'L''eau chez vous')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN sector sec ON sec.id = e.sector_id
JOIN service s ON s.sector_id = sec.id AND s.code IN ('ELECTRICITY_AGENCY', 'ELECTRICITY_SUPPLY', 'WATER_AGENCY', 'WATER_SUPPLY')
WHERE sec.code IN ('ELECTRICITY', 'WATER')
ON CONFLICT DO NOTHING;
