-- 0064: two Woyofal topics for Senelec (decided by Olivia, 2026-10-09), shown on
-- « Le courant chez vous » and « Une démarche en agence » after « Oui » to
-- « Avez-vous un compteur Woyofal (prépayé) ? »:
--   WOYOFAL_RECHARGE « Recharge Woyofal (facile, code reçu et valide) »;
--   WOYOFAL_AMOUNT « Montant de la recharge Woyofal (kWh reçus et frais clairs) ».
-- PREPAID_METER becomes their gate, asked on the themes screen like
-- PAID_SOMETHING, so it leaves the agency's questions (it would be asked twice).
-- Both topics follow the power quality, so the gate shows them together.

UPDATE topic SET position = position + 2 WHERE position > 52;

INSERT INTO topic (code, position, category_id)
SELECT v.code, v.position, c.id
FROM (VALUES ('WOYOFAL_RECHARGE', 53, 'SERVICE_QUALITY'), ('WOYOFAL_AMOUNT', 54, 'COST')) AS v (code, position, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('WOYOFAL_RECHARGE', 'Recharge Woyofal (facile, code reçu et valide)'),
  ('WOYOFAL_AMOUNT', 'Montant de la recharge Woyofal (kWh reçus et frais clairs)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_condition (topic_id, depends_on_question_id, option_id)
SELECT t.id, q.id, o.id
FROM topic t, question q
JOIN answer_option o ON o.question_id = q.id AND o.code = 'YES'
WHERE t.code IN ('WOYOFAL_RECHARGE', 'WOYOFAL_AMOUNT') AND q.code = 'PREPAID_METER';

INSERT INTO topic_set (code) VALUES ('WOYOFAL');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'WOYOFAL' AND t.code IN ('WOYOFAL_RECHARGE', 'WOYOFAL_AMOUNT');

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, (SELECT max(position) + 1 FROM service_topic_set m WHERE m.service_id = s.id)
FROM service s, topic_set ts
WHERE s.code IN ('ELECTRICITY_SUPPLY', 'ELECTRICITY_AGENCY') AND ts.code = 'WOYOFAL';

-- The question leaves the agency's list.
DELETE FROM question_condition c
USING question_set qs, question q
WHERE c.question_set_id = qs.id AND qs.code = 'ELECTRICITY_AGENCY'
  AND c.question_id = q.id AND q.code = 'PREPAID_METER';

DELETE FROM question_set_item i
USING question_set qs, question q
WHERE i.question_set_id = qs.id AND qs.code = 'ELECTRICITY_AGENCY'
  AND i.question_id = q.id AND q.code = 'PREPAID_METER';

UPDATE question_set_item i SET position = i.position - 1
FROM question_set qs
WHERE i.question_set_id = qs.id AND qs.code = 'ELECTRICITY_AGENCY' AND i.position > 2;
