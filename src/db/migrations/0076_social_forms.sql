-- 0076: the social form (decided by Olivia, 2026-10-10,
-- /mnt/project-files/questionnaire/validation-social.md): social security and
-- pension agencies ask whether the pension or benefit is paid on time.

INSERT INTO question (code, type, category_id)
SELECT 'BENEFIT_PAID_ON_TIME', 'single_choice', c.id FROM evaluation_category c WHERE c.code = 'DELAYS';

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', 'Votre pension ou prestation est-elle versée à temps ?' FROM question q
WHERE q.code = 'BENEFIT_PAID_ON_TIME';

-- « Je ne suis pas concerné(e) » carries no value.
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES ('YES', 3, 1), ('LATE', 2, 2), ('NOT_PAID', 1, 3), ('NOT_CONCERNED', NULL::int, 4))
  AS v (option, value, position), question q
WHERE q.code = 'BENEFIT_PAID_ON_TIME';

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES ('YES', 'Oui'), ('LATE', 'Avec du retard'), ('NOT_PAID', 'Pas encore versée'),
             ('NOT_CONCERNED', 'Je ne suis pas concerné(e)')) AS v (option, label)
JOIN question q ON q.code = 'BENEFIT_PAID_ON_TIME'
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('SOCIAL_BENEFITS');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1 FROM question_set qs, question q
WHERE qs.code = 'SOCIAL_BENEFITS' AND q.code = 'BENEFIT_PAID_ON_TIME';

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT et.id, qs.id, 1 FROM establishment_type et, question_set qs
WHERE et.code = 'SOCIAL_SECURITY_OFFICE' AND qs.code = 'SOCIAL_BENEFITS';
