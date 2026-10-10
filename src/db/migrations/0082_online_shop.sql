-- 0082: online shops and Jumia (decided by Olivia, 2026-10-10,
-- /mnt/project-files/questionnaire/vente-en-ligne-jumia.md). A new commerce
-- type « Vente en ligne », Jumia its first organisation, rated « in general ».
-- One path for the type, « Une commande en ligne »:
--   how the order was received (ORDER_RECEPTION), a fact: delivered or
--     collected at a pickup point;
--   after a delivery, whether the courier came on time (COURIER_ON_TIME, 0066);
--   then, either way, whether the parcel was received (PARCEL_RECEIVED, 0066):
--     opened by ORDER_RECEPTION, so the page keeps this order (the chain
--     takes the outcome's place, byCategory);
--   after a « Oui », whether the product matched the listing
--     (PRODUCT_AS_DESCRIBED), an outcome;
--   whether a return or a refund was asked for (RETURN_REQUEST), an outcome
--     valued like ACCOUNT_REFUNDED (a refusal counts lowest, « Non » has no value).
-- The topics (2A): the shop's ones (waiting time, opening hours, cleanliness,
-- access) do not go to a website. As for health (0070), the sector's COMMERCE
-- topics go only to a commerce establishment without a type, and every
-- existing commerce type gets them itself: no existing form changes. The
-- online shop gets the staff's two, the fees, the customer service, and the
-- delivery's four through its path. The sector's three questions stay.

-- ---------------------------------------------------------------------------
-- The type and Jumia
-- ---------------------------------------------------------------------------
INSERT INTO establishment_type (code, sector_id)
SELECT 'ONLINE_SHOP', id FROM sector WHERE code = 'RETAIL';

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT id, 'fr', 'Vente en ligne' FROM establishment_type WHERE code = 'ONLINE_SHOP';

INSERT INTO organization (code, name, full_name, sector_id)
SELECT 'JUMIA', 'Jumia', 'Jumia Sénégal', id FROM sector WHERE code = 'RETAIL';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id, type_id)
SELECT o.name, '{Jumia Sénégal,vente en ligne,achat en ligne,commande en ligne,e-commerce}', o.id, 'general',
       et.sector_id, et.id
FROM organization o, establishment_type et
WHERE o.code = 'JUMIA' AND et.code = 'ONLINE_SHOP';

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type) VALUES ('ORDER_RECEPTION', 'single_choice');

INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('PRODUCT_AS_DESCRIBED', 'OUTCOME'), ('RETURN_REQUEST', 'OUTCOME')) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('ORDER_RECEPTION', 'Comment avez-vous reçu votre commande ?'),
  ('PRODUCT_AS_DESCRIBED', 'Le produit correspondait-il à l''annonce (photo, description, taille) ?'),
  ('RETURN_REQUEST', 'Avez-vous demandé un retour ou un remboursement ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('ORDER_RECEPTION', 'DELIVERED', NULL::int, 1), ('ORDER_RECEPTION', 'PICKUP_POINT', NULL, 2),
  ('PRODUCT_AS_DESCRIBED', 'YES', 3, 1), ('PRODUCT_AS_DESCRIBED', 'PARTLY', 2, 2),
  ('PRODUCT_AS_DESCRIBED', 'NO', 1, 3),
  ('RETURN_REQUEST', 'NO', NULL, 1), ('RETURN_REQUEST', 'SETTLED', 3, 2),
  ('RETURN_REQUEST', 'PENDING', 2, 3), ('RETURN_REQUEST', 'REFUSED', 1, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('ORDER_RECEPTION', 'DELIVERED', 'Livrée à une adresse'),
  ('ORDER_RECEPTION', 'PICKUP_POINT', 'Retirée dans un point de retrait'),
  ('PRODUCT_AS_DESCRIBED', 'YES', 'Oui'), ('PRODUCT_AS_DESCRIBED', 'PARTLY', 'En partie'),
  ('PRODUCT_AS_DESCRIBED', 'NO', 'Non'),
  ('RETURN_REQUEST', 'NO', 'Non'), ('RETURN_REQUEST', 'SETTLED', 'Oui, et c''est réglé'),
  ('RETURN_REQUEST', 'PENDING', 'Oui, pas encore réglé'), ('RETURN_REQUEST', 'REFUSED', 'Oui, refusé')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('ONLINE_ORDER');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('ORDER_RECEPTION', 1), ('COURIER_ON_TIME', 2), ('PARCEL_RECEIVED', 3), ('PRODUCT_AS_DESCRIBED', 4),
  ('RETURN_REQUEST', 5)
) AS v (question, position)
JOIN question_set qs ON qs.code = 'ONLINE_ORDER'
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM (VALUES
  ('COURIER_ON_TIME', 'ORDER_RECEPTION', 'DELIVERED'),
  ('PARCEL_RECEIVED', 'ORDER_RECEPTION', 'DELIVERED'),
  ('PARCEL_RECEIVED', 'ORDER_RECEPTION', 'PICKUP_POINT'),
  ('PRODUCT_AS_DESCRIBED', 'PARCEL_RECEIVED', 'YES')
) AS v (question, depends_on, option)
JOIN question_set qs ON qs.code = 'ONLINE_ORDER'
JOIN question q ON q.code = v.question
JOIN question d ON d.code = v.depends_on
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- The path
-- ---------------------------------------------------------------------------
INSERT INTO service (code, synonyms) VALUES
  ('ONLINE_ORDER', '{commande,achat en ligne,vente en ligne,livraison,colis,point de retrait,retour,remboursement}');

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Une commande en ligne' FROM service WHERE code = 'ONLINE_ORDER';

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, 1 FROM service s, topic_set ts WHERE s.code = 'ONLINE_ORDER' AND ts.code = 'DELIVERY';

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s, question_set qs WHERE s.code = 'ONLINE_ORDER' AND qs.code = 'ONLINE_ORDER';

INSERT INTO establishment_type_service (type_id, service_id)
SELECT et.id, s.id FROM establishment_type et, service s WHERE et.code = 'ONLINE_SHOP' AND s.code = 'ONLINE_ORDER';

-- ---------------------------------------------------------------------------
-- The topics of each commerce type
-- ---------------------------------------------------------------------------
UPDATE sector_topic_set SET only_without_type = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'RETAIL')
  AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'COMMERCE');

-- The existing types: COMMERCE first, as when it came from the sector.
UPDATE establishment_type_topic_set SET position = position + 1
WHERE type_id IN (SELECT et.id FROM establishment_type et JOIN sector s ON s.id = et.sector_id
                  WHERE s.code = 'RETAIL' AND et.code <> 'ONLINE_SHOP');

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, 1
FROM establishment_type et
JOIN sector s ON s.id = et.sector_id
JOIN topic_set ts ON ts.code = 'COMMERCE'
WHERE s.code = 'RETAIL' AND et.code <> 'ONLINE_SHOP';

INSERT INTO topic_set (code) VALUES ('ONLINE_SHOP');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'ONLINE_SHOP' AND t.code = 'CUSTOMER_SERVICE';

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, v.position
FROM (VALUES ('STAFF_SKILLS', 1), ('FEES', 2), ('ONLINE_SHOP', 3)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
JOIN establishment_type et ON et.code = 'ONLINE_SHOP';
