-- 0026: mobile money (Wave, Orange Money, Mixx by Yas), validated by Olivia on
-- 2026-10-06. The one service of 0025 got the bank agencies' topics and
-- questions (opening hours, cleanliness, waiting before being received…),
-- which do not fit an application. It becomes three services, chosen on
-- screen 1 like Senelec's (0019), each with its own topics:
--   MOBILE_MONEY         « Utilisation de l'application mobile »
--   MOBILE_MONEY_AGENT   « Opération dans un point de service »
--   MOBILE_MONEY_SUPPORT « Service client (appel, réclamation) »
-- They stay in the Banking and insurance sector but no longer get its topics
-- and questions, nor the common topics (« Compétence du personnel » means
-- nothing for an application): service.replaces_shared_lists. The banks keep
-- them; the agent and the customer service get « Compétence » in their list.
--
-- Also, searching « wave » listed Orange and Yas next to Wave: the service had
-- the brand names Orange Money, Wave and Mixx among its synonyms. A brand name
-- belongs to its own organisation (already a synonym of Wave, Orange and Yas),
-- so the services keep only everyday words.

ALTER TABLE service ADD COLUMN replaces_shared_lists boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, v.position, c.id
FROM (VALUES
  ('OPERATION_SPEED', 16, 'DELAYS'),
  ('RESPONSE_TIME', 17, 'DELAYS'),
  ('APP_EASE', 25, 'PROCEDURE'),
  ('SUPPORT_REACHABILITY', 26, 'PROCEDURE'),
  ('OPERATION_RELIABILITY', 45, 'OUTCOME'),
  ('SERVICE_AVAILABILITY', 55, 'SERVICE_QUALITY'),
  ('AGENT_LIQUIDITY', 56, 'SERVICE_QUALITY'),
  ('ACCOUNT_SECURITY', 57, 'SERVICE_QUALITY'),
  ('AGENT_PROXIMITY', 67, 'PREMISES')
) AS v (code, position, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('OPERATION_SPEED', 'Rapidité des opérations'),
  ('RESPONSE_TIME', 'Délai de réponse'),
  ('APP_EASE', 'Facilité d''utilisation de l''application'),
  ('SUPPORT_REACHABILITY', 'Facilité à joindre le service client'),
  ('OPERATION_RELIABILITY', 'Fiabilité des opérations (l''argent arrive, pas d''échec)'),
  ('SERVICE_AVAILABILITY', 'Disponibilité du service (pas de panne)'),
  ('AGENT_LIQUIDITY', 'Argent disponible chez l''agent'),
  ('ACCOUNT_SECURITY', 'Sécurité du compte (fraudes, arnaques)'),
  ('AGENT_PROXIMITY', 'Proximité des points de service')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('MOBILE_MONEY_APP'), ('MOBILE_MONEY_AGENT'), ('MOBILE_MONEY_SUPPORT');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('MOBILE_MONEY_APP', 'APP_EASE'), ('MOBILE_MONEY_APP', 'OPERATION_SPEED'),
  ('MOBILE_MONEY_APP', 'OPERATION_RELIABILITY'), ('MOBILE_MONEY_APP', 'SERVICE_AVAILABILITY'),
  ('MOBILE_MONEY_APP', 'FEES'), ('MOBILE_MONEY_APP', 'ACCOUNT_SECURITY'),
  ('MOBILE_MONEY_AGENT', 'STAFF'), ('MOBILE_MONEY_AGENT', 'AGENT_LIQUIDITY'),
  ('MOBILE_MONEY_AGENT', 'WAIT_TIME'), ('MOBILE_MONEY_AGENT', 'OPERATION_RELIABILITY'),
  ('MOBILE_MONEY_AGENT', 'FEES'), ('MOBILE_MONEY_AGENT', 'AGENT_PROXIMITY'),
  ('MOBILE_MONEY_SUPPORT', 'SUPPORT_REACHABILITY'), ('MOBILE_MONEY_SUPPORT', 'RESPONSE_TIME'),
  ('MOBILE_MONEY_SUPPORT', 'REQUEST_HANDLING'), ('MOBILE_MONEY_SUPPORT', 'STAFF'),
  ('MOBILE_MONEY_SUPPORT', 'INFORMATION'),
  ('MOBILE_MONEY_AGENT', 'PROFESSIONALISM'), ('MOBILE_MONEY_SUPPORT', 'PROFESSIONALISM')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

-- ---------------------------------------------------------------------------
-- Questions: the place of the operation is now the service.
-- ---------------------------------------------------------------------------
DELETE FROM question_condition
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'MOBILE_MONEY');
DELETE FROM question_set_item
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'MOBILE_MONEY');

INSERT INTO question_set (code) VALUES ('MOBILE_MONEY_AGENT'), ('MOBILE_MONEY_SUPPORT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('MOBILE_MONEY', 'MONEY_OPERATION_OK', 1),
  ('MOBILE_MONEY', 'MONEY_PROBLEM_SOLVED', 2),
  ('MOBILE_MONEY_AGENT', 'MONEY_OPERATION_OK', 1),
  ('MOBILE_MONEY_AGENT', 'MONEY_PROBLEM_SOLVED', 2),
  ('MOBILE_MONEY_AGENT', 'AGENT_CASH', 3),
  ('MOBILE_MONEY_SUPPORT', 'MONEY_PROBLEM_SOLVED', 1)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- Problem solved only after a failed or blocked operation (always asked to
-- the customer service).
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('MOBILE_MONEY', 'FAILED'), ('MOBILE_MONEY', 'BLOCKED'),
  ('MOBILE_MONEY_AGENT', 'FAILED'), ('MOBILE_MONEY_AGENT', 'BLOCKED')
) AS v (list, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = 'MONEY_PROBLEM_SOLVED'
JOIN question dq ON dq.code = 'MONEY_OPERATION_OK'
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- The services
-- ---------------------------------------------------------------------------
UPDATE service
SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'MOBILE_MONEY_APP'),
    replaces_shared_lists = true,
    synonyms = '{application,appli,transfert,envoi d''argent,paiement,solde}'
WHERE code = 'MOBILE_MONEY';

UPDATE service_translation SET label = 'Utilisation de l''application mobile'
WHERE language = 'fr' AND service_id = (SELECT id FROM service WHERE code = 'MOBILE_MONEY');

INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms, replaces_shared_lists)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[], true
FROM (VALUES
  ('MOBILE_MONEY_AGENT', '{agent,point de service,dépôt,retrait,cash}'),
  ('MOBILE_MONEY_SUPPORT', '{service client,réclamation,argent bloqué,compte bloqué}')
) AS v (code, synonyms)
JOIN sector s ON s.code = 'BANKING_INSURANCE'
JOIN topic_set ts ON ts.code = v.code
JOIN question_set qs ON qs.code = v.code;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('MOBILE_MONEY_AGENT', 'Opération dans un point de service'),
  ('MOBILE_MONEY_SUPPORT', 'Service client (appel, réclamation)')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT es.establishment_id, s.id
FROM establishment_service es
JOIN service s ON s.code IN ('MOBILE_MONEY_AGENT', 'MOBILE_MONEY_SUPPORT')
WHERE es.service_id = (SELECT id FROM service WHERE code = 'MOBILE_MONEY');
