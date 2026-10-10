-- 0081: « Une réclamation sur le compte (opération, frais, fraude) » for the
-- banks and microfinances and the mobile money services (decided by Olivia,
-- 2026-10-10, /mnt/project-files/questionnaire/reclamation-compte.md: A1, B2,
-- C1, D1, E1). It judges the problem on the account and how it was settled;
-- the mobile money's « Service client » keeps judging the contact itself.
--   What the claim was about (ACCOUNT_CLAIM_SUBJECT), a fact;
--   after one of the four problems, whether one was refunded (ACCOUNT_REFUNDED),
--     an outcome valued like CLAIM_PAID (a refusal counts lowest);
--   after a refund, in full or in part, how long it took (ACCOUNT_CLAIM_DELAY),
--     a delay, with a week apart from a month.
-- Seven topics that exist; « Suivi et transparence du dossier » shown without
-- « Avez-vous déposé un dossier ? », a claim being one. No « Dans quelle
-- agence ? » (0078): a claim is made by phone or in writing as well.

INSERT INTO question (code, type) VALUES ('ACCOUNT_CLAIM_SUBJECT', 'single_choice');

INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('ACCOUNT_REFUNDED', 'OUTCOME'), ('ACCOUNT_CLAIM_DELAY', 'DELAYS')) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('ACCOUNT_CLAIM_SUBJECT', 'Votre réclamation porte sur :'),
  ('ACCOUNT_REFUNDED', 'Avez-vous été remboursé(e) ?'),
  ('ACCOUNT_CLAIM_DELAY', 'Combien de temps pour régler votre réclamation ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_OPERATION', NULL, 1), ('ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_WITHDRAWAL', NULL, 2),
  ('ACCOUNT_CLAIM_SUBJECT', 'UNJUSTIFIED_FEES', NULL, 3), ('ACCOUNT_CLAIM_SUBJECT', 'FRAUD_REFUND', NULL, 4),
  ('ACCOUNT_CLAIM_SUBJECT', 'OTHER', NULL, 5),
  ('ACCOUNT_REFUNDED', 'YES', 4, 1), ('ACCOUNT_REFUNDED', 'PARTLY', 3, 2),
  ('ACCOUNT_REFUNDED', 'NOT_YET', 2, 3), ('ACCOUNT_REFUNDED', 'REFUSED', 1, 4),
  ('ACCOUNT_CLAIM_DELAY', 'UNDER_1_WEEK', 1, 1), ('ACCOUNT_CLAIM_DELAY', '1_WEEK_TO_1_MONTH', 2, 2),
  ('ACCOUNT_CLAIM_DELAY', '1_TO_3_MONTHS', 3, 3), ('ACCOUNT_CLAIM_DELAY', 'OVER_3_MONTHS', 4, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_OPERATION', 'Une opération que je ne reconnais pas (virement, prélèvement, paiement)'),
  ('ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_WITHDRAWAL', 'Un retrait que je n''ai pas fait'),
  ('ACCOUNT_CLAIM_SUBJECT', 'UNJUSTIFIED_FEES', 'Des frais non justifiés'),
  ('ACCOUNT_CLAIM_SUBJECT', 'FRAUD_REFUND', 'Un remboursement après une fraude ou une arnaque'),
  ('ACCOUNT_CLAIM_SUBJECT', 'OTHER', 'Autre chose'),
  ('ACCOUNT_REFUNDED', 'YES', 'Oui, en totalité'), ('ACCOUNT_REFUNDED', 'PARTLY', 'En partie'),
  ('ACCOUNT_REFUNDED', 'NOT_YET', 'Pas encore'), ('ACCOUNT_REFUNDED', 'REFUSED', 'Non, refusé'),
  ('ACCOUNT_CLAIM_DELAY', 'UNDER_1_WEEK', 'Moins d''une semaine'),
  ('ACCOUNT_CLAIM_DELAY', '1_WEEK_TO_1_MONTH', '1 semaine à 1 mois'),
  ('ACCOUNT_CLAIM_DELAY', '1_TO_3_MONTHS', '1 à 3 mois'),
  ('ACCOUNT_CLAIM_DELAY', 'OVER_3_MONTHS', 'Plus de 3 mois')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('ACCOUNT_CLAIM');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('ACCOUNT_CLAIM_SUBJECT', 1), ('ACCOUNT_REFUNDED', 2), ('ACCOUNT_CLAIM_DELAY', 3)) AS v (question, position)
JOIN question_set qs ON qs.code = 'ACCOUNT_CLAIM'
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM (VALUES
  ('ACCOUNT_REFUNDED', 'ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_OPERATION'),
  ('ACCOUNT_REFUNDED', 'ACCOUNT_CLAIM_SUBJECT', 'UNKNOWN_WITHDRAWAL'),
  ('ACCOUNT_REFUNDED', 'ACCOUNT_CLAIM_SUBJECT', 'UNJUSTIFIED_FEES'),
  ('ACCOUNT_REFUNDED', 'ACCOUNT_CLAIM_SUBJECT', 'FRAUD_REFUND'),
  ('ACCOUNT_CLAIM_DELAY', 'ACCOUNT_REFUNDED', 'YES'),
  ('ACCOUNT_CLAIM_DELAY', 'ACCOUNT_REFUNDED', 'PARTLY')
) AS v (question, depends_on, option)
JOIN question_set qs ON qs.code = 'ACCOUNT_CLAIM'
JOIN question q ON q.code = v.question
JOIN question d ON d.code = v.depends_on
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = v.option;

-- The topics: the claim's own five, then the staff's two.
INSERT INTO topic_set (code) VALUES ('ACCOUNT_CLAIM');

INSERT INTO topic_set_item (topic_set_id, topic_id, shown_always)
SELECT s.id, t.id, t.code = 'CASE_TRACKING'
FROM topic_set s, topic t
WHERE s.code = 'ACCOUNT_CLAIM'
  AND t.code IN ('SUPPORT_REACHABILITY', 'REQUEST_HANDLING', 'RESPONSE_TIME', 'CASE_TRACKING', 'ACCOUNT_SECURITY');

INSERT INTO service (code, synonyms) VALUES
  ('ACCOUNT_CLAIM', '{réclamation,contestation,prélèvement,débit,agios,frais,fraude,arnaque,piratage,remboursement,retrait}');

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Une réclamation sur le compte (opération, frais, fraude)' FROM service WHERE code = 'ACCOUNT_CLAIM';

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM (VALUES ('ACCOUNT_CLAIM', 1), ('STAFF_SKILLS', 2)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
JOIN service s ON s.code = 'ACCOUNT_CLAIM';

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s, question_set qs WHERE s.code = 'ACCOUNT_CLAIM' AND qs.code = 'ACCOUNT_CLAIM';

-- The banks (microfinances included) and the mobile money services.
INSERT INTO establishment_type_service (type_id, service_id)
SELECT et.id, s.id
FROM establishment_type et, service s
WHERE et.code IN ('BANK', 'MOBILE_MONEY_PROVIDER') AND s.code = 'ACCOUNT_CLAIM';
