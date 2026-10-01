-- Common questions (validated 2026-10-01): asked in every sector, after the
-- sector's own questions on screen 6, to the users not satisfied. « Common »
-- because the questionnaire COMMON is linked to no sector or service: the site
-- always loads it, like ESSENTIAL.

-- « This question is shown only if that question got one of these answers. »
-- One row per accepted answer. A question without rows is always shown.
-- The answer must belong to the question it depends on (checked by the key).
CREATE TABLE question_condition (
  question_id            int NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  depends_on_question_id int NOT NULL REFERENCES question (id),
  option_id              int NOT NULL,
  PRIMARY KEY (question_id, option_id),
  FOREIGN KEY (option_id, depends_on_question_id) REFERENCES answer_option (id, question_id),
  CHECK (question_id <> depends_on_question_id)
);

INSERT INTO questionnaire (code, version, status, published_at)
VALUES ('COMMON', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position)
SELECT qn.id, v.code, 'single_choice', v.position
FROM (VALUES ('REPORTED', 1), ('REPORT_WHY', 2)) AS v (code, position)
CROSS JOIN questionnaire qn
WHERE qn.code = 'COMMON' AND qn.version = 1;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('REPORTED', 'Avez-vous signalé ce problème à l''établissement (accueil, service client, direction…) ?'),
  ('REPORT_WHY', 'Pourquoi ?')
) AS v (code, label)
JOIN question q ON q.code = v.code
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'COMMON' AND qn.version = 1;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES
  ('REPORTED', 'YES_ANSWERED', 1),
  ('REPORTED', 'YES_NO_ANSWER', 2),
  ('REPORTED', 'COULD_NOT_REACH', 3),
  ('REPORTED', 'NO', 4),
  ('REPORT_WHY', 'DID_NOT_KNOW_WHO', 1),
  ('REPORT_WHY', 'POINTLESS', 2),
  ('REPORT_WHY', 'OTHER', 3)
) AS v (question, option, position)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'COMMON' AND qn.version = 1;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('REPORTED', 'YES_ANSWERED', 'Oui, et on m''a répondu'),
  ('REPORTED', 'YES_NO_ANSWER', 'Oui, mais sans réponse'),
  ('REPORTED', 'COULD_NOT_REACH', 'J''ai essayé, sans réussir à les joindre'),
  ('REPORTED', 'NO', 'Non'),
  ('REPORT_WHY', 'DID_NOT_KNOW_WHO', 'Je ne savais pas à qui m''adresser'),
  ('REPORT_WHY', 'POINTLESS', 'Je pensais que ça ne servirait à rien'),
  ('REPORT_WHY', 'OTHER', 'Autre raison')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'COMMON' AND qn.version = 1
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- REPORTED: only after « Peu satisfait(e) » or « Pas du tout satisfait(e) ».
-- REPORT_WHY: only after « Non » to REPORTED.
INSERT INTO question_condition (question_id, depends_on_question_id, option_id)
SELECT q.id, dq.id, ao.id
FROM (VALUES
  ('COMMON', 'REPORTED', 'ESSENTIAL', 'OVERALL_SATISFACTION', 'DISSATISFIED'),
  ('COMMON', 'REPORTED', 'ESSENTIAL', 'OVERALL_SATISFACTION', 'VERY_DISSATISFIED'),
  ('COMMON', 'REPORT_WHY', 'COMMON', 'REPORTED', 'NO')
) AS v (questionnaire, question, depends_on_questionnaire, depends_on, option)
JOIN questionnaire qn ON qn.code = v.questionnaire AND qn.version = 1
JOIN question q ON q.questionnaire_id = qn.id AND q.code = v.question
JOIN questionnaire dqn ON dqn.code = v.depends_on_questionnaire AND dqn.version = 1
JOIN question dq ON dq.questionnaire_id = dqn.id AND dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;
