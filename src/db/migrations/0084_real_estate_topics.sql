-- 0084: the topics and questions of real estate (decided by Olivia,
-- 2026-10-15). None of the sector's topics fitted a sale or a rental (the
-- counter's wait, opening hours, premises): they go only to « Autre démarche »
-- now, like the transport's for the taxi (0060), and each service gets its
-- own. Both still get the sector's questions (COMMERCE: fair price, receipt),
-- after their own.
--   PROPERTY_SALE: price, fees, the papers (the transfer of ownership), the
--     commitments kept; first who one was (buyer or seller) and the kind of
--     property, two facts;
--   PROPERTY_RENTAL: the rent, the deposit and advance, the commission, the
--     state of the home, the lease kept, the deposit given back.

UPDATE sector_topic_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'REAL_ESTATE');

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('PROPERTY_PRICE', 1, 'COST'),
  ('PROPERTY_FEES', 2, 'COST'),
  ('PROPERTY_PAPERS', 3, 'PROCEDURE'),
  ('COMMITMENTS_KEPT', 4, 'OUTCOME'),
  ('RENT_AMOUNT', 5, 'COST'),
  ('DEPOSIT_AND_ADVANCE', 6, 'COST'),
  ('AGENT_COMMISSION', 7, 'COST'),
  ('HOUSING_CONDITION', 8, 'SERVICE_QUALITY'),
  ('LEASE_KEPT', 9, 'SERVICE_QUALITY'),
  ('DEPOSIT_RETURNED', 10, 'OUTCOME')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_PRICE', 'Prix du bien'),
  ('PROPERTY_FEES', 'Frais (notaire, commission, enregistrement)'),
  ('PROPERTY_PAPERS', 'Obtention des papiers du bien (facilité de mutation)'),
  ('COMMITMENTS_KEPT', 'Respect des engagements (délais, conformité du bien)'),
  ('RENT_AMOUNT', 'Montant du loyer'),
  ('DEPOSIT_AND_ADVANCE', 'Caution et avance demandées'),
  ('AGENT_COMMISSION', 'Commission d''agence ou de démarcheur'),
  ('HOUSING_CONDITION', 'État du logement à l''entrée'),
  ('LEASE_KEPT', 'Respect du bail (réparations, hausses, préavis)'),
  ('DEPOSIT_RETURNED', 'Restitution de la caution')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('PROPERTY_SALE'), ('PROPERTY_RENTAL');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('PROPERTY_SALE', 'PROPERTY_PRICE'), ('PROPERTY_SALE', 'PROPERTY_FEES'), ('PROPERTY_SALE', 'PROPERTY_PAPERS'),
  ('PROPERTY_SALE', 'COMMITMENTS_KEPT'),
  ('PROPERTY_RENTAL', 'RENT_AMOUNT'), ('PROPERTY_RENTAL', 'DEPOSIT_AND_ADVANCE'), ('PROPERTY_RENTAL', 'AGENT_COMMISSION'),
  ('PROPERTY_RENTAL', 'HOUSING_CONDITION'), ('PROPERTY_RENTAL', 'LEASE_KEPT'), ('PROPERTY_RENTAL', 'DEPOSIT_RETURNED')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, 1
FROM service s JOIN topic_set ts ON ts.code = s.code
WHERE s.code IN ('PROPERTY_SALE', 'PROPERTY_RENTAL');

-- ---------------------------------------------------------------------------
-- Questions of the sale: two facts (no category, no value)
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type) VALUES ('PROPERTY_ROLE', 'single_choice'), ('PROPERTY_KIND', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_ROLE', 'Vous étiez :'),
  ('PROPERTY_KIND', 'Quel type de bien ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES
  ('PROPERTY_ROLE', 'BUYER', 1), ('PROPERTY_ROLE', 'SELLER', 2),
  ('PROPERTY_KIND', 'LAND', 1), ('PROPERTY_KIND', 'HOUSE', 2), ('PROPERTY_KIND', 'APARTMENT', 3),
  ('PROPERTY_KIND', 'COMMERCIAL', 4), ('PROPERTY_KIND', 'OTHER', 5)
) AS v (question, option, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_ROLE', 'BUYER', 'L''acheteur'), ('PROPERTY_ROLE', 'SELLER', 'Le vendeur'),
  ('PROPERTY_KIND', 'LAND', 'Terrain ou parcelle'), ('PROPERTY_KIND', 'HOUSE', 'Maison ou villa'),
  ('PROPERTY_KIND', 'APARTMENT', 'Appartement'), ('PROPERTY_KIND', 'COMMERCIAL', 'Local commercial'),
  ('PROPERTY_KIND', 'OTHER', 'Autre')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('PROPERTY_SALE');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('PROPERTY_ROLE', 1), ('PROPERTY_KIND', 2)) AS v (question, position)
JOIN question_set qs ON qs.code = 'PROPERTY_SALE'
JOIN question q ON q.code = v.question;

-- The sector's questions (COMMERCE) for « Autre démarche » only, and by name
-- after each service's own, as for the banks (0057): who one was comes first.
UPDATE sector_question_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'REAL_ESTATE');

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, v.position
FROM (VALUES
  ('PROPERTY_SALE', 'PROPERTY_SALE', 1), ('PROPERTY_SALE', 'COMMERCE', 2),
  ('PROPERTY_RENTAL', 'COMMERCE', 1)
) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN question_set qs ON qs.code = v.list;
