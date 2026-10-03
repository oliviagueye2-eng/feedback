-- « Non concerné » and the questions that open a topic (validated on
-- 2026-10-03, /mnt/project-files/questionnaire/non-concerne/proposition.md).
--
-- 1. Screen 2b gets a third answer per topic, « Non concerné ». It is kept, to
--    know later which topics do not speak to the users, and never counts in
--    the published shares: those count « Bien » and « Pas bien » only (0007).
-- 2. Some topics are useless to most users: the delay of an intervention after
--    a road check, the fees when nothing was paid, the file when none was
--    handed in. A yes/no question comes first, in the place of the topic, and
--    the topic is shown only after « Oui ». The questions of screen 6 about
--    the same thing (the receipt, the time the officers took to come) follow
--    the same answer, and the answer is never asked twice.

-- ---------------------------------------------------------------------------
-- « Non concerné »
-- ---------------------------------------------------------------------------
ALTER TABLE feedback_topic DROP CONSTRAINT feedback_topic_sentiment_check;
ALTER TABLE feedback_topic ADD CONSTRAINT feedback_topic_sentiment_check
  CHECK (sentiment IN ('positive', 'negative', 'not_concerned'));

-- ---------------------------------------------------------------------------
-- The three yes/no questions
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type) VALUES
  ('INTERVENTION_AWAITED', 'single_choice'),
  ('PAID_SOMETHING', 'single_choice'),
  ('FILE_SUBMITTED', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('INTERVENTION_AWAITED', 'Avez-vous attendu une intervention sur le terrain ?'),
  ('PAID_SOMETHING', 'Avez-vous payé quelque chose ?'),
  ('FILE_SUBMITTED', 'Avez-vous déposé un dossier ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- No value: « Oui » is not better than « Non ».
INSERT INTO answer_option (question_id, code, position)
SELECT q.id, v.option, v.position
FROM question q, (VALUES ('YES', 1), ('NO', 2)) AS v (option, position)
WHERE q.code IN ('INTERVENTION_AWAITED', 'PAID_SOMETHING', 'FILE_SUBMITTED');

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', CASE o.code WHEN 'YES' THEN 'Oui' ELSE 'Non' END
FROM answer_option o
JOIN question q ON q.id = o.question_id
WHERE q.code IN ('INTERVENTION_AWAITED', 'PAID_SOMETHING', 'FILE_SUBMITTED');

-- ---------------------------------------------------------------------------
-- Topics shown only after an answer
-- ---------------------------------------------------------------------------
-- « This topic is shown only if that question got one of these answers. » One
-- row per accepted answer, one question per topic; a topic without rows is
-- always shown. Per topic, not per list: a topic means the same everywhere.
-- Screen 2b asks the question in the place of the first of its topics, and
-- shows its topics right under it.
CREATE TABLE topic_condition (
  topic_id               smallint NOT NULL REFERENCES topic (id),
  depends_on_question_id int NOT NULL,
  option_id              int NOT NULL,
  PRIMARY KEY (topic_id, option_id),
  FOREIGN KEY (option_id, depends_on_question_id) REFERENCES answer_option (id, question_id)
);

-- Lets the domain check that a topic depends on one question only.
CREATE UNIQUE INDEX topic_condition_one_question
  ON topic_condition (topic_id, depends_on_question_id);

INSERT INTO topic_condition (topic_id, depends_on_question_id, option_id)
SELECT t.id, q.id, o.id
FROM (VALUES
  ('INTERVENTION_TIME', 'INTERVENTION_AWAITED'),
  ('FEES', 'PAID_SOMETHING'),
  ('PROCESSING_TIME', 'FILE_SUBMITTED'),
  ('CASE_TRACKING', 'FILE_SUBMITTED')
) AS v (topic, question)
JOIN topic t ON t.code = v.topic
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = 'YES';

-- ---------------------------------------------------------------------------
-- Screen 6: the same answers open the questions about the same thing
-- ---------------------------------------------------------------------------
-- « Avez-vous payé quelque chose ? » comes right before the receipt (and the
-- fees explained, at a bank); « Avez-vous attendu une intervention… ? » right
-- before the time the officers took to come. Screen 6 does not show them
-- again when screen 2b already asked them (a topic they open is offered to
-- the feedback): a road check has no fees topic, so the payment is asked there.
CREATE TEMPORARY TABLE gate_item (list text, gate text, before text);
INSERT INTO gate_item VALUES
  ('BANKING_INSURANCE', 'PAID_SOMETHING', 'FEES_EXPLAINED'),
  ('EDUCATION', 'PAID_SOMETHING', 'RECEIPT_GIVEN'),
  ('FILE_SERVICES', 'PAID_SOMETHING', 'RECEIPT_GIVEN'),
  ('GENERIC', 'PAID_SOMETHING', 'RECEIPT_OR_INVOICE'),
  ('HEALTH', 'PAID_SOMETHING', 'RECEIPT_GIVEN'),
  ('POLICE_FIELD', 'INTERVENTION_AWAITED', 'ARRIVAL_TIME'),
  ('POLICE_FIELD', 'PAID_SOMETHING', 'RECEIPT_GIVEN'),
  ('POLICE_PREMISES', 'PAID_SOMETHING', 'RECEIPT_GIVEN');

-- Each list makes room: the question it goes before, and the ones after, move
-- down by one (in two steps, positions being unique per list).
UPDATE question_set_item i SET position = i.position + 1000
FROM gate_item g
JOIN question_set s ON s.code = g.list
JOIN question_set_item b ON b.question_set_id = s.id
JOIN question bq ON bq.id = b.question_id AND bq.code = g.before
WHERE i.question_set_id = s.id AND i.position >= b.position;

UPDATE question_set_item i SET position = i.position - 1000
  + (SELECT count(*) FROM gate_item g
     JOIN question_set s ON s.code = g.list
     JOIN question_set_item b ON b.question_set_id = s.id
     JOIN question bq ON bq.id = b.question_id AND bq.code = g.before
     WHERE s.id = i.question_set_id AND b.position <= i.position)::int
WHERE i.position > 1000;

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT s.id, q.id, b.position - 1
FROM gate_item g
JOIN question_set s ON s.code = g.list
JOIN question q ON q.code = g.gate
JOIN question_set_item b ON b.question_set_id = s.id
JOIN question bq ON bq.id = b.question_id AND bq.code = g.before;

-- The time to come now follows « Oui » to the intervention, and no longer the
-- kind of situation (a call for help).
DELETE FROM question_condition
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'POLICE_FIELD')
  AND question_id = (SELECT id FROM question WHERE code = 'ARRIVAL_TIME');

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT s.id, bq.id, gq.id, o.id
FROM gate_item g
JOIN question_set s ON s.code = g.list
JOIN question bq ON bq.code = g.before
JOIN question gq ON gq.code = g.gate
JOIN answer_option o ON o.question_id = gq.id AND o.code = 'YES';

DROP TABLE gate_item;

-- « Je n'ai rien payé » leaves the receipt questions: only those who paid see
-- them. The option stays for the answers already given, and is no longer offered.
ALTER TABLE answer_option ADD COLUMN is_active boolean NOT NULL DEFAULT true;

UPDATE answer_option SET is_active = false
WHERE code = 'NOTHING_PAID'
  AND question_id IN (SELECT id FROM question WHERE code IN ('RECEIPT_GIVEN', 'RECEIPT_OR_INVOICE'));
