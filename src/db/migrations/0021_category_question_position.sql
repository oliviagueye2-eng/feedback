-- The questions page follows the categories like the topics page (2026-10-05),
-- but « Résultat obtenu » comes first there: « Avez-vous obtenu ce que vous
-- étiez venu(e) chercher ? » is the main question. Its own column, so the
-- topics and the public results keep the categories' order.
ALTER TABLE evaluation_category ADD COLUMN question_position smallint;
UPDATE evaluation_category SET question_position = CASE WHEN code = 'OUTCOME' THEN 0 ELSE position END;
ALTER TABLE evaluation_category ALTER COLUMN question_position SET NOT NULL;
