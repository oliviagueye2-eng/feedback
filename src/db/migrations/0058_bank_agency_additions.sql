-- 0058: three additions to the bank agency (decided by Olivia, 2026-10-09):
--   « Respect de l'intimité » (PRIVACY, the health topic), for discretion at the counter;
--   after « Un crédit »: whether the credit request got an answer (CREDIT_ANSWER),
--     an outcome valued like CLAIM_PAID (a refusal counts lowest);
--   after « Une carte »: whether the card came in the time announced (CARD_ON_TIME),
--     a delay.

INSERT INTO topic_set (code) VALUES ('BANK_AGENCY');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'BANK_AGENCY' AND t.code = 'PRIVACY';

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, (SELECT max(position) + 1 FROM service_topic_set m WHERE m.service_id = s.id)
FROM service s, topic_set ts WHERE s.code = 'BANK_AGENCY' AND ts.code = 'BANK_AGENCY';

INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('CREDIT_ANSWER', 'OUTCOME'), ('CARD_ON_TIME', 'DELAYS')) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('CREDIT_ANSWER', 'Votre demande de crédit a-t-elle reçu une réponse ?'),
  ('CARD_ON_TIME', 'Avez-vous reçu votre carte dans le délai annoncé ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('CREDIT_ANSWER', 'ACCEPTED', 3, 1), ('CREDIT_ANSWER', 'REFUSED', 1, 2), ('CREDIT_ANSWER', 'NOT_YET', 2, 3),
  ('CARD_ON_TIME', 'YES', 3, 1), ('CARD_ON_TIME', 'NO', 1, 2), ('CARD_ON_TIME', 'NOT_YET', 2, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('CREDIT_ANSWER', 'ACCEPTED', 'Oui, acceptée'), ('CREDIT_ANSWER', 'REFUSED', 'Oui, refusée'),
  ('CREDIT_ANSWER', 'NOT_YET', 'Pas encore'),
  ('CARD_ON_TIME', 'YES', 'Oui'), ('CARD_ON_TIME', 'NO', 'Non'), ('CARD_ON_TIME', 'NOT_YET', 'Pas encore')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('CREDIT_ANSWER', 2), ('CARD_ON_TIME', 3)) AS v (question, position)
JOIN question_set qs ON qs.code = 'BANK_AGENCY'
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM (VALUES ('CREDIT_ANSWER', 'CREDIT'), ('CARD_ON_TIME', 'CARD')) AS v (question, option)
JOIN question_set qs ON qs.code = 'BANK_AGENCY'
JOIN question q ON q.code = v.question
JOIN question d ON d.code = 'BANK_SUBJECT'
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = v.option;
