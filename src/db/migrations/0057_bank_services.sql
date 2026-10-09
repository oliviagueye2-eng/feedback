-- 0057: three services for the banks and microfinances (decided by Olivia,
-- 2026-10-09). They had none: every feedback went through the sector's lists.
--   BANK_AGENCY « Une démarche en agence »: the sector's lists, plus what the
--     procedure was about;
--   ATM_WITHDRAWAL « Un retrait au distributeur »: no staff, so its own topics,
--     one of them new (« Argent disponible dans le distributeur »), the fees
--     block, and whether the withdrawal worked;
--   BANK_APP « L'application ou la banque en ligne »: the lists of the mobile
--     payment app (MOBILE_MONEY_APP, MOBILE_MONEY).
-- The insurers keep their claim service. The sector's lists now go only to the
-- feedbacks without a service (« Autre démarche », 0053) and, by name, to the
-- agency and the claim: the cash machine and the app get no counter or premises.

-- The new topic, with the cash of the mobile money agent.
INSERT INTO topic (code, position, category_id)
SELECT 'ATM_CASH', 58, id FROM evaluation_category WHERE code = 'SERVICE_QUALITY';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Argent disponible dans le distributeur' FROM topic WHERE code = 'ATM_CASH';

INSERT INTO topic_set (code) VALUES ('ATM_WITHDRAWAL');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'ATM_WITHDRAWAL' AND t.code IN ('SERVICE_AVAILABILITY', 'ATM_CASH', 'AGENT_PROXIMITY', 'ACCOUNT_SECURITY');

-- What the agency procedure was about: a fact, like AGENCY_SUBJECT (no category).
INSERT INTO question (code, type) VALUES ('BANK_SUBJECT', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Votre démarche porte sur :' FROM question WHERE code = 'BANK_SUBJECT';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES ('ACCOUNT', 1), ('CREDIT', 2), ('CARD', 3), ('TRANSFER', 4), ('OTHER', 5)) AS v (option, position)
JOIN question q ON q.code = 'BANK_SUBJECT';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('ACCOUNT', 'Un compte'),
  ('CREDIT', 'Un crédit'),
  ('CARD', 'Une carte'),
  ('TRANSFER', 'Un transfert d''argent'),
  ('OTHER', 'Autre chose')
) AS v (option, label)
JOIN question q ON q.code = 'BANK_SUBJECT'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- Whether the withdrawal worked: an outcome, valued like MONEY_OPERATION_OK.
INSERT INTO question (code, type, category_id)
SELECT 'ATM_WITHDRAWAL_OK', 'single_choice', id FROM evaluation_category WHERE code = 'OUTCOME';

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Le retrait a-t-il fonctionné ?' FROM question WHERE code = 'ATM_WITHDRAWAL_OK';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES ('YES', 3, 1), ('OUT_OF_SERVICE', 2, 2), ('CARD_RETAINED', 1, 3), ('DEBITED_NO_CASH', 1, 4)) AS v (option, value, position)
JOIN question q ON q.code = 'ATM_WITHDRAWAL_OK';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('YES', 'Oui'),
  ('OUT_OF_SERVICE', 'Non, distributeur en panne ou vide'),
  ('CARD_RETAINED', 'Non, carte avalée'),
  ('DEBITED_NO_CASH', 'Non, compte débité sans recevoir l''argent')
) AS v (option, label)
JOIN question q ON q.code = 'ATM_WITHDRAWAL_OK'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('BANK_AGENCY'), ('ATM_WITHDRAWAL');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('BANK_AGENCY', 'BANK_SUBJECT', 1),
             ('ATM_WITHDRAWAL', 'ATM_WITHDRAWAL_OK', 1),
             ('ATM_WITHDRAWAL', 'MONEY_PROBLEM_SOLVED', 2)) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- « Le problème a-t-il été réglé ? » after a « Non ».
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM question_set qs, question q, question d
JOIN answer_option ao ON ao.question_id = d.id AND ao.code IN ('OUT_OF_SERVICE', 'CARD_RETAINED', 'DEBITED_NO_CASH')
WHERE qs.code = 'ATM_WITHDRAWAL' AND q.code = 'MONEY_PROBLEM_SOLVED' AND d.code = 'ATM_WITHDRAWAL_OK';

-- The services.
INSERT INTO service (code, synonyms) VALUES
  ('BANK_AGENCY', '{agence,guichet,compte,crédit,prêt,carte,virement,conseiller}'),
  ('ATM_WITHDRAWAL', '{distributeur,GAB,DAB,retrait,carte,billets}'),
  ('BANK_APP', '{application,appli,"banque en ligne",internet,virement,solde}');

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('BANK_AGENCY', 'Une démarche en agence'),
  ('ATM_WITHDRAWAL', 'Un retrait au distributeur'),
  ('BANK_APP', 'L''application ou la banque en ligne')
) AS v (code, label)
JOIN service s ON s.code = v.code;

-- The sector's lists: only without a service, and by name to the agency and the claim.
UPDATE sector_topic_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'BANKING_INSURANCE');
UPDATE sector_question_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'BANKING_INSURANCE');

UPDATE service_question_set SET position = position + 1
WHERE service_id = (SELECT id FROM service WHERE code = 'INSURANCE_CLAIM');

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, x.topic_set_id, x.position
FROM sector_topic_set x, service s
WHERE x.sector_id = (SELECT id FROM sector WHERE code = 'BANKING_INSURANCE')
  AND s.code IN ('BANK_AGENCY', 'INSURANCE_CLAIM');

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, v.position
FROM (VALUES ('BANK_AGENCY', 'BANK_AGENCY', 1), ('BANK_AGENCY', 'BANKING_INSURANCE', 2),
             ('INSURANCE_CLAIM', 'BANKING_INSURANCE', 1),
             ('ATM_WITHDRAWAL', 'ATM_WITHDRAWAL', 1),
             ('BANK_APP', 'MOBILE_MONEY', 1)) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN question_set qs ON qs.code = v.list;

-- The cash machine also gets « Frais payés », after « Avez-vous payé quelque chose ? » (Olivia).
INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM (VALUES ('ATM_WITHDRAWAL', 'ATM_WITHDRAWAL', 1), ('ATM_WITHDRAWAL', 'FEES', 2),
             ('BANK_APP', 'MOBILE_MONEY_APP', 1)) AS v (service, list, position)
JOIN service s ON s.code = v.service
JOIN topic_set ts ON ts.code = v.list;

-- The banks and microfinances (the sector's establishments without the claim) offer them.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN sector se ON se.id = e.sector_id AND se.code = 'BANKING_INSURANCE'
CROSS JOIN service s
WHERE s.code IN ('BANK_AGENCY', 'ATM_WITHDRAWAL', 'BANK_APP')
  AND NOT EXISTS (SELECT 1 FROM establishment_service x JOIN service c ON c.id = x.service_id
                  WHERE x.establishment_id = e.id AND c.code = 'INSURANCE_CLAIM');
