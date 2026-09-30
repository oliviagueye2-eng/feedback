-- Screen 2b, option D (2026-09-30): each topic touched is marked « Bien »
-- (positive) or « Pas bien » (negative), so a mixed visit can be told (good
-- welcome, long wait). Before, the sense of every topic followed the answer
-- to the essential question.

ALTER TABLE feedback_topic
  ADD COLUMN sentiment text CHECK (sentiment IN ('positive', 'negative'));

-- Topics saved before: the sense they had on screen, « Ce qui vous a plu »
-- after a satisfied answer, « Ce qui n'a pas été » after any other.
UPDATE feedback_topic ft
SET sentiment = CASE WHEN ao.code IN ('VERY_SATISFIED', 'SATISFIED') THEN 'positive' ELSE 'negative' END
FROM answer a
JOIN question q ON q.id = a.question_id AND q.code = 'OVERALL_SATISFACTION'
JOIN answer_option ao ON ao.id = a.option_id
WHERE a.feedback_id = ft.feedback_id;

-- A topic without an essential answer cannot be saved from screen 2b: none
-- is expected, and none can be given a sense.
DELETE FROM feedback_topic WHERE sentiment IS NULL;

ALTER TABLE feedback_topic ALTER COLUMN sentiment SET NOT NULL;
