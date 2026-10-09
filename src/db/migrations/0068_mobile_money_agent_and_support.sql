-- 0068: mobile money (decided by Olivia, 2026-10-09).
--   At the agent: what the operation was (MONEY_OPERATION_KIND); « L'agent
--     avait-il assez d'argent ? » only after a withdrawal, and the topic
--     « Argent disponible chez l'agent » goes, the question replacing it.
--   At the customer service: what one contacted it for (SUPPORT_REASON);
--     « Le problème a-t-il été réglé ? » only after a problem.

-- What the operation or the contact was about: facts (no category).
INSERT INTO question (code, type) VALUES ('MONEY_OPERATION_KIND', 'single_choice'), ('SUPPORT_REASON', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('MONEY_OPERATION_KIND', 'Votre opération était :'),
  ('SUPPORT_REASON', 'Vous avez contacté le service client pour :')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES
  ('MONEY_OPERATION_KIND', 'DEPOSIT', 1), ('MONEY_OPERATION_KIND', 'WITHDRAWAL', 2),
  ('MONEY_OPERATION_KIND', 'TRANSFER', 3), ('MONEY_OPERATION_KIND', 'OTHER', 4),
  ('SUPPORT_REASON', 'PROBLEM', 1), ('SUPPORT_REASON', 'INFORMATION', 2), ('SUPPORT_REASON', 'OTHER', 3)
) AS v (question, option, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('MONEY_OPERATION_KIND', 'DEPOSIT', 'Un dépôt'), ('MONEY_OPERATION_KIND', 'WITHDRAWAL', 'Un retrait'),
  ('MONEY_OPERATION_KIND', 'TRANSFER', 'Un transfert'), ('MONEY_OPERATION_KIND', 'OTHER', 'Autre chose'),
  ('SUPPORT_REASON', 'PROBLEM', 'Un problème sur une opération'),
  ('SUPPORT_REASON', 'INFORMATION', 'Une information'), ('SUPPORT_REASON', 'OTHER', 'Autre chose')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- Each first in its list.
UPDATE question_set_item SET position = position + 1
WHERE question_set_id IN (SELECT id FROM question_set WHERE code IN ('MOBILE_MONEY_AGENT', 'MOBILE_MONEY_SUPPORT'));

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1
FROM (VALUES ('MOBILE_MONEY_AGENT', 'MONEY_OPERATION_KIND'), ('MOBILE_MONEY_SUPPORT', 'SUPPORT_REASON')) AS v (list, question)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM (VALUES
  ('MOBILE_MONEY_AGENT', 'AGENT_CASH', 'MONEY_OPERATION_KIND', 'WITHDRAWAL'),
  ('MOBILE_MONEY_SUPPORT', 'MONEY_PROBLEM_SOLVED', 'SUPPORT_REASON', 'PROBLEM')
) AS v (list, question, depends_on, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question
JOIN question d ON d.code = v.depends_on
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = v.option;

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'MOBILE_MONEY_AGENT')
  AND topic_id = (SELECT id FROM topic WHERE code = 'AGENT_LIQUIDITY');
