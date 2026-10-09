-- 0069: « Service client (appel, réclamation) » for the phone operators and
-- the TV companies (decided by Olivia, 2026-10-09), like mobile money's: its
-- topics, then what one contacted it for and, after a problem, whether it was
-- solved. The other telecom paths keep « Service client et réclamations ».

INSERT INTO question (code, type) VALUES ('TELECOM_SUPPORT_REASON', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT id, 'fr', 'Vous avez contacté le service client pour :' FROM question WHERE code = 'TELECOM_SUPPORT_REASON';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES ('PROBLEM', 1), ('INFORMATION', 2), ('OTHER', 3)) AS v (option, position)
JOIN question q ON q.code = 'TELECOM_SUPPORT_REASON';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('PROBLEM', 'Un problème (réseau, facture, crédit, image)'),
  ('INFORMATION', 'Une information'),
  ('OTHER', 'Autre chose')
) AS v (option, label)
JOIN question q ON q.code = 'TELECOM_SUPPORT_REASON'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('TELECOM_SUPPORT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('TELECOM_SUPPORT_REASON', 1), ('MONEY_PROBLEM_SOLVED', 2)) AS v (question, position)
JOIN question_set qs ON qs.code = 'TELECOM_SUPPORT'
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM question_set qs, question q, question d
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = 'PROBLEM'
WHERE qs.code = 'TELECOM_SUPPORT' AND q.code = 'MONEY_PROBLEM_SOLVED' AND d.code = 'TELECOM_SUPPORT_REASON';

INSERT INTO service (code, synonyms) VALUES
  ('TELECOM_SUPPORT', '{"service client",réclamation,appel,plainte,assistance}');

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Service client (appel, réclamation)' FROM service WHERE code = 'TELECOM_SUPPORT';

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM (VALUES ('MOBILE_MONEY_SUPPORT', 1), ('STAFF_SKILLS', 2)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
JOIN service s ON s.code = 'TELECOM_SUPPORT';

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s, question_set qs WHERE s.code = 'TELECOM_SUPPORT' AND qs.code = 'TELECOM_SUPPORT';

-- Those who offer the network or the image.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT DISTINCT x.establishment_id, s.id
FROM establishment_service x
JOIN service p ON p.id = x.service_id AND p.code IN ('PHONE_INTERNET', 'TV_SUBSCRIPTION')
CROSS JOIN service s
WHERE s.code = 'TELECOM_SUPPORT';
