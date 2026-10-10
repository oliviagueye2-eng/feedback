-- 0075: the tax forms (decided by Olivia, 2026-10-10,
-- /mnt/project-files/questionnaire/validation-impots.md):
--   tax office and treasury: whether the amount to pay was explained, after
--     « Oui » to « Avez-vous payé quelque chose ? »;
--   customs: the customs clearance.

INSERT INTO question (code, type, category_id)
SELECT 'AMOUNT_EXPLAINED', 'single_choice', c.id FROM evaluation_category c WHERE c.code = 'COST';

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', 'Le montant à payer vous a-t-il été expliqué ?' FROM question q WHERE q.code = 'AMOUNT_EXPLAINED';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES ('YES', 3, 1), ('PARTLY', 2, 2), ('NO', 1, 3)) AS v (option, value, position), question q
WHERE q.code = 'AMOUNT_EXPLAINED';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES ('YES', 'Oui'), ('PARTLY', 'En partie'), ('NO', 'Non')) AS v (option, label)
JOIN question q ON q.code = 'AMOUNT_EXPLAINED'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO topic (code, position, category_id)
SELECT 'CUSTOMS_CLEARANCE', (SELECT max(position) FROM topic) + 1, c.id FROM evaluation_category c WHERE c.code = 'DELAYS';

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', 'Dédouanement (délai, marchandise libérée à temps)' FROM topic t WHERE t.code = 'CUSTOMS_CLEARANCE';

-- ---------------------------------------------------------------------------
-- Lists
-- ---------------------------------------------------------------------------
INSERT INTO question_set (code) VALUES ('TAX_PAYMENT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1 FROM question_set qs, question q WHERE qs.code = 'TAX_PAYMENT' AND q.code = 'AMOUNT_EXPLAINED';

-- Only after « Oui » to the payment (asked by the sector's PAID_AND_RECEIPT).
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM question_set qs, question q, question d
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = 'YES'
WHERE qs.code = 'TAX_PAYMENT' AND q.code = 'AMOUNT_EXPLAINED' AND d.code = 'PAID_SOMETHING';

INSERT INTO topic_set (code) VALUES ('CUSTOMS');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'CUSTOMS' AND t.code = 'CUSTOMS_CLEARANCE';

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT et.id, qs.id, 1 FROM establishment_type et, question_set qs
WHERE et.code IN ('TAX_OFFICE', 'TREASURY_OFFICE') AND qs.code = 'TAX_PAYMENT';

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, 1 FROM establishment_type et, topic_set ts
WHERE et.code = 'CUSTOMS_OFFICE' AND ts.code = 'CUSTOMS';
