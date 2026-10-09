-- 0065: the telecom paths (decided by Olivia, 2026-10-09). One path mixed the
-- network and the shop; now, like Senelec and Sen'Eau:
--   Orange, Yas, Expresso: PHONE_INTERNET « Le réseau mobile (appels, SMS,
--     internet) », HOME_INTERNET « Internet à la maison (fibre, box) »,
--     TELECOM_SHOP « Une démarche en boutique »;
--   Canal+, StarTimes: TV_SUBSCRIPTION « L'image et les chaînes », with two
--     new topics, and TV_SHOP « Une démarche en boutique ».
-- The shops get the agency's topics (UTILITY_AGENCY and the blocks) and its
-- questions (FILE_SERVICES, PAID_AND_RECEIPT) after their own subject.
-- PHONE_INTERNET and TV_SUBSCRIPTION keep their codes, so their QR codes and
-- feedbacks stay valid. The sector's lists now go only to « Autre démarche »
-- (and La Poste), without the TELECOM list: the shop's blocks and questions,
-- like Senelec's « Autre démarche ».

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
UPDATE topic SET position = position + 2 WHERE position > 57;

INSERT INTO topic (code, position, category_id)
SELECT v.code, v.position, c.id
FROM (VALUES ('TV_SIGNAL', 58), ('TV_CHANNELS', 59)) AS v (code, position)
JOIN evaluation_category c ON c.code = 'SERVICE_QUALITY';

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('TV_SIGNAL', 'Qualité de l''image et du signal'),
  ('TV_CHANNELS', 'Chaînes reçues conformes à l''abonnement')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('MOBILE_NETWORK'), ('HOME_INTERNET'), ('TV_IMAGE');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('MOBILE_NETWORK', 'NETWORK_QUALITY'), ('MOBILE_NETWORK', 'CUSTOMER_SERVICE'),
  ('HOME_INTERNET', 'NETWORK_QUALITY'), ('HOME_INTERNET', 'INTERVENTION_TIME'),
  ('HOME_INTERNET', 'CUSTOMER_SERVICE'), ('HOME_INTERNET', 'BILLING'),
  ('TV_IMAGE', 'TV_SIGNAL'), ('TV_IMAGE', 'TV_CHANNELS'), ('TV_IMAGE', 'INTERVENTION_TIME'),
  ('TV_IMAGE', 'CUSTOMER_SERVICE')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- The mobile network's subject: calls or mobile internet only.
UPDATE answer_option SET is_active = false
WHERE code IN ('HOME_INTERNET', 'BILLING')
  AND question_id = (SELECT id FROM question WHERE code = 'TELECOM_SUBJECT');

DELETE FROM question_condition
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'TELECOM')
  AND option_id IN (SELECT ao.id FROM answer_option ao JOIN question q ON q.id = ao.question_id
                    WHERE q.code = 'TELECOM_SUBJECT' AND ao.code = 'HOME_INTERNET');

-- What the shop visit was about: a fact, like AGENCY_SUBJECT (no category).
INSERT INTO question (code, type) VALUES ('TELECOM_SHOP_SUBJECT', 'single_choice'), ('TV_SHOP_SUBJECT', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Votre démarche porte sur :' FROM question WHERE code IN ('TELECOM_SHOP_SUBJECT', 'TV_SHOP_SUBJECT');

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES
  ('TELECOM_SHOP_SUBJECT', 'SIM_NUMBER', 1), ('TELECOM_SHOP_SUBJECT', 'BILL_CREDIT', 2),
  ('TELECOM_SHOP_SUBJECT', 'SUBSCRIPTION', 3), ('TELECOM_SHOP_SUBJECT', 'OTHER', 4),
  ('TV_SHOP_SUBJECT', 'SUBSCRIPTION', 1), ('TV_SHOP_SUBJECT', 'DECODER', 2), ('TV_SHOP_SUBJECT', 'OTHER', 3)
) AS v (question, option, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('TELECOM_SHOP_SUBJECT', 'SIM_NUMBER', 'Une puce ou un numéro'),
  ('TELECOM_SHOP_SUBJECT', 'BILL_CREDIT', 'Une facture ou du crédit'),
  ('TELECOM_SHOP_SUBJECT', 'SUBSCRIPTION', 'Un abonnement'),
  ('TELECOM_SHOP_SUBJECT', 'OTHER', 'Autre chose'),
  ('TV_SHOP_SUBJECT', 'SUBSCRIPTION', 'Un abonnement ou un réabonnement'),
  ('TV_SHOP_SUBJECT', 'DECODER', 'Un décodeur ou une antenne'),
  ('TV_SHOP_SUBJECT', 'OTHER', 'Autre chose')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('HOME_INTERNET'), ('TELECOM_SHOP'), ('TV_SHOP');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1
FROM (VALUES ('HOME_INTERNET', 'NETWORK_LOSS'), ('TELECOM_SHOP', 'TELECOM_SHOP_SUBJECT'),
             ('TV_SHOP', 'TV_SHOP_SUBJECT')) AS v (list, question)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- ---------------------------------------------------------------------------
-- The services
-- ---------------------------------------------------------------------------
UPDATE service_translation SET label = 'Le réseau mobile (appels, SMS, internet)'
WHERE language = 'fr' AND service_id = (SELECT id FROM service WHERE code = 'PHONE_INTERNET');
UPDATE service SET synonyms = '{téléphone,appels,SMS,"internet mobile",réseau,forfait,4G,5G}' WHERE code = 'PHONE_INTERNET';

UPDATE service_translation SET label = 'L''image et les chaînes'
WHERE language = 'fr' AND service_id = (SELECT id FROM service WHERE code = 'TV_SUBSCRIPTION');
UPDATE service SET synonyms = '{télévision,télé,image,signal,chaînes,coupure}' WHERE code = 'TV_SUBSCRIPTION';

INSERT INTO service (code, synonyms) VALUES
  ('HOME_INTERNET', '{internet,fibre,box,wifi,ADSL,débit,connexion}'),
  ('TELECOM_SHOP', '{boutique,agence,puce,SIM,numéro,facture,crédit,abonnement}'),
  ('TV_SHOP', '{boutique,agence,abonnement,réabonnement,décodeur,antenne}');

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('HOME_INTERNET', 'Internet à la maison (fibre, box)'),
  ('TELECOM_SHOP', 'Une démarche en boutique'),
  ('TV_SHOP', 'Une démarche en boutique')
) AS v (code, label)
JOIN service s ON s.code = v.code;

-- Their topics (the mobile network keeps its questions, TELECOM, and the TV TV_SUBSCRIPTION).
INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM (VALUES
  ('PHONE_INTERNET', 'MOBILE_NETWORK', 1), ('PHONE_INTERNET', 'FEES', 2),
  ('HOME_INTERNET', 'HOME_INTERNET', 1),
  ('TV_SUBSCRIPTION', 'TV_IMAGE', 1),
  ('TELECOM_SHOP', 'UTILITY_AGENCY', 1), ('TELECOM_SHOP', 'STAFF_SKILLS', 2), ('TELECOM_SHOP', 'COUNTER', 3),
  ('TELECOM_SHOP', 'PREMISES', 4), ('TELECOM_SHOP', 'FEES', 5),
  ('TV_SHOP', 'UTILITY_AGENCY', 1), ('TV_SHOP', 'STAFF_SKILLS', 2), ('TV_SHOP', 'COUNTER', 3),
  ('TV_SHOP', 'PREMISES', 4), ('TV_SHOP', 'FEES', 5)
) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN topic_set ts ON ts.code = v.list;

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, v.position
FROM (VALUES
  ('HOME_INTERNET', 'HOME_INTERNET', 1),
  ('TELECOM_SHOP', 'TELECOM_SHOP', 1), ('TELECOM_SHOP', 'FILE_SERVICES', 2), ('TELECOM_SHOP', 'PAID_AND_RECEIPT', 3),
  ('TV_SHOP', 'TV_SHOP', 1), ('TV_SHOP', 'FILE_SERVICES', 2), ('TV_SHOP', 'PAID_AND_RECEIPT', 3)
) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN question_set qs ON qs.code = v.list;

-- The phone operators and the TV companies offer them.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT x.establishment_id, s.id
FROM establishment_service x
JOIN service p ON p.id = x.service_id
JOIN service s ON (p.code = 'PHONE_INTERNET' AND s.code IN ('HOME_INTERNET', 'TELECOM_SHOP'))
               OR (p.code = 'TV_SUBSCRIPTION' AND s.code = 'TV_SHOP');

-- The sector's lists: « Autre démarche » only, and no longer the TELECOM list.
DELETE FROM sector_topic_set
WHERE sector_id = (SELECT id FROM sector WHERE code = 'TELECOM')
  AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'TELECOM');

UPDATE sector_topic_set SET only_without_service = true, position = position - 1
WHERE sector_id = (SELECT id FROM sector WHERE code = 'TELECOM');

INSERT INTO sector_question_set (sector_id, question_set_id, position, only_without_service)
SELECT s.id, qs.id, v.position, true
FROM sector s,
     (VALUES ('FILE_SERVICES', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE s.code = 'TELECOM';
