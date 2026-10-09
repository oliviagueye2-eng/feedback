-- 0066: the sector « Livraisons (Postes, livreurs) » (decided by Olivia,
-- 2026-10-09, /mnt/project-files/questionnaire/validation-poste-livraison.md).
-- La Poste leaves the telecom for it. Two services:
--   POSTAL_COUNTER « Un service au guichet (envoi ou retrait) »: the counter's
--     blocks; what one came for, then the tracking number after a sending and
--     whether the item was there after a collection; the wait and the receipt;
--   DELIVERY « Une livraison (enlèvement ou réception) »: four new topics;
--     whether the courier came on time after a pickup, whether the parcel
--     arrived after a delivery.
-- « Autre démarche » gets the counter's blocks and the results' questions, as
-- in the telecom (0065).

INSERT INTO sector (code) VALUES ('DELIVERY');

INSERT INTO sector_translation (sector_id, language, label)
SELECT id, 'fr', 'Livraisons (Postes, livreurs)' FROM sector WHERE code = 'DELIVERY';

UPDATE organization SET sector_id = (SELECT id FROM sector WHERE code = 'DELIVERY') WHERE code = 'LA_POSTE';

UPDATE establishment SET sector_id = (SELECT id FROM sector WHERE code = 'DELIVERY')
WHERE organization_id = (SELECT id FROM organization WHERE code = 'LA_POSTE');

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('DELIVERY_TIME', 1, 'DELAYS'),
  ('COURIER_PUNCTUALITY', 2, 'DELAYS'),
  ('PARCEL_TRACKING', 3, 'PROCEDURE'),
  ('PARCEL_CONDITION', 4, 'SERVICE_QUALITY')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('DELIVERY_TIME', 'Délai de livraison'),
  ('COURIER_PUNCTUALITY', 'Ponctualité du livreur (venu à l''heure prévue)'),
  ('PARCEL_TRACKING', 'Suivi du colis (informations à jour)'),
  ('PARCEL_CONDITION', 'État du colis (intact, complet)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('DELIVERY');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'DELIVERY'
  AND t.code IN ('DELIVERY_TIME', 'COURIER_PUNCTUALITY', 'PARCEL_TRACKING', 'PARCEL_CONDITION', 'PROFESSIONALISM');

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- What one came for and the delivery's kind are facts (no category).
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES
  ('POSTAL_COUNTER_SUBJECT', NULL), ('TRACKING_NUMBER_GIVEN', 'PROCEDURE'), ('ITEM_AVAILABLE', 'OUTCOME'),
  ('DELIVERY_KIND', NULL), ('COURIER_ON_TIME', 'DELAYS'), ('PARCEL_RECEIVED', 'OUTCOME')
) AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('POSTAL_COUNTER_SUBJECT', 'Vous êtes venu(e) pour :'),
  ('TRACKING_NUMBER_GIVEN', 'Vous a-t-on donné un numéro de suivi ?'),
  ('ITEM_AVAILABLE', 'Votre courrier ou colis était-il là ?'),
  ('DELIVERY_KIND', 'La livraison concernait :'),
  ('COURIER_ON_TIME', 'Le livreur est-il venu à l''heure prévue ?'),
  ('PARCEL_RECEIVED', 'Avez-vous reçu votre colis ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- Valued like the other outcomes and delays; « not needed » has no value.
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('POSTAL_COUNTER_SUBJECT', 'SEND', NULL::int, 1), ('POSTAL_COUNTER_SUBJECT', 'COLLECT', NULL, 2),
  ('POSTAL_COUNTER_SUBJECT', 'OTHER', NULL, 3),
  ('TRACKING_NUMBER_GIVEN', 'YES', 2, 1), ('TRACKING_NUMBER_GIVEN', 'NO', 1, 2),
  ('TRACKING_NUMBER_GIVEN', 'NOT_NEEDED', NULL, 3),
  ('ITEM_AVAILABLE', 'YES', 3, 1), ('ITEM_AVAILABLE', 'DAMAGED', 2, 2), ('ITEM_AVAILABLE', 'NO', 1, 3),
  ('DELIVERY_KIND', 'PICKUP', NULL, 1), ('DELIVERY_KIND', 'DROP_OFF', NULL, 2),
  ('COURIER_ON_TIME', 'YES', 3, 1), ('COURIER_ON_TIME', 'LATE', 2, 2), ('COURIER_ON_TIME', 'NO_SHOW', 1, 3),
  ('PARCEL_RECEIVED', 'YES', 3, 1), ('PARCEL_RECEIVED', 'DAMAGED', 2, 2), ('PARCEL_RECEIVED', 'NOT_YET', 2, 3),
  ('PARCEL_RECEIVED', 'LOST', 1, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('POSTAL_COUNTER_SUBJECT', 'SEND', 'Envoyer un courrier ou un colis'),
  ('POSTAL_COUNTER_SUBJECT', 'COLLECT', 'Retirer un courrier ou un colis'),
  ('POSTAL_COUNTER_SUBJECT', 'OTHER', 'Autre chose'),
  ('TRACKING_NUMBER_GIVEN', 'YES', 'Oui'), ('TRACKING_NUMBER_GIVEN', 'NO', 'Non'),
  ('TRACKING_NUMBER_GIVEN', 'NOT_NEEDED', 'Je n''en avais pas besoin'),
  ('ITEM_AVAILABLE', 'YES', 'Oui'), ('ITEM_AVAILABLE', 'DAMAGED', 'Oui, mais abîmé ou incomplet'),
  ('ITEM_AVAILABLE', 'NO', 'Non'),
  ('DELIVERY_KIND', 'PICKUP', 'Un colis enlevé chez moi'), ('DELIVERY_KIND', 'DROP_OFF', 'Un colis livré chez moi'),
  ('COURIER_ON_TIME', 'YES', 'Oui'), ('COURIER_ON_TIME', 'LATE', 'En retard'),
  ('COURIER_ON_TIME', 'NO_SHOW', 'Non, il n''est pas venu'),
  ('PARCEL_RECEIVED', 'YES', 'Oui'), ('PARCEL_RECEIVED', 'DAMAGED', 'Oui, mais abîmé ou incomplet'),
  ('PARCEL_RECEIVED', 'NOT_YET', 'Pas encore'), ('PARCEL_RECEIVED', 'LOST', 'Non, il est perdu')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('POSTAL_COUNTER'), ('DELIVERY');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('POSTAL_COUNTER', 'POSTAL_COUNTER_SUBJECT', 1), ('POSTAL_COUNTER', 'TRACKING_NUMBER_GIVEN', 2),
  ('POSTAL_COUNTER', 'ITEM_AVAILABLE', 3), ('POSTAL_COUNTER', 'WAIT_TIME', 4),
  ('DELIVERY', 'DELIVERY_KIND', 1), ('DELIVERY', 'COURIER_ON_TIME', 2), ('DELIVERY', 'PARCEL_RECEIVED', 3)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM (VALUES
  ('POSTAL_COUNTER', 'TRACKING_NUMBER_GIVEN', 'POSTAL_COUNTER_SUBJECT', 'SEND'),
  ('POSTAL_COUNTER', 'ITEM_AVAILABLE', 'POSTAL_COUNTER_SUBJECT', 'COLLECT'),
  ('DELIVERY', 'COURIER_ON_TIME', 'DELIVERY_KIND', 'PICKUP'),
  ('DELIVERY', 'PARCEL_RECEIVED', 'DELIVERY_KIND', 'DROP_OFF')
) AS v (list, question, depends_on, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question
JOIN question d ON d.code = v.depends_on
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- The services
-- ---------------------------------------------------------------------------
INSERT INTO service (code, synonyms) VALUES
  ('POSTAL_COUNTER', '{poste,guichet,courrier,colis,lettre,envoi,retrait,recommandé}'),
  ('DELIVERY', '{livraison,livreur,colis,enlèvement,coursier,suivi}');

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('POSTAL_COUNTER', 'Un service au guichet (envoi ou retrait)'),
  ('DELIVERY', 'Une livraison (enlèvement ou réception)')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM (VALUES
  ('POSTAL_COUNTER', 'STAFF_SKILLS', 1), ('POSTAL_COUNTER', 'COUNTER', 2), ('POSTAL_COUNTER', 'PREMISES', 3),
  ('POSTAL_COUNTER', 'FEES', 4),
  ('DELIVERY', 'DELIVERY', 1), ('DELIVERY', 'FEES', 2)
) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN topic_set ts ON ts.code = v.list;

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, v.position
FROM (VALUES
  ('POSTAL_COUNTER', 'POSTAL_COUNTER', 1), ('POSTAL_COUNTER', 'PAID_AND_RECEIPT', 2),
  ('DELIVERY', 'DELIVERY', 1)
) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN question_set qs ON qs.code = v.list;

-- La Poste offers both.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e, service s
WHERE e.organization_id = (SELECT id FROM organization WHERE code = 'LA_POSTE')
  AND s.code IN ('POSTAL_COUNTER', 'DELIVERY');

-- « Autre démarche »: the counter's blocks and the results' questions.
INSERT INTO sector_topic_set (sector_id, topic_set_id, position, only_without_service)
SELECT s.id, ts.id, v.position, true
FROM sector s,
     (VALUES ('STAFF_SKILLS', 1), ('COUNTER', 2), ('PREMISES', 3), ('FEES', 4)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE s.code = 'DELIVERY';

INSERT INTO sector_question_set (sector_id, question_set_id, position, only_without_service)
SELECT s.id, qs.id, v.position, true
FROM sector s,
     (VALUES ('FILE_SERVICES', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE s.code = 'DELIVERY';
