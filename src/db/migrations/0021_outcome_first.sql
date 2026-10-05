-- One order of the categories for the topics, the questions and the results
-- (2026-10-05, « une seule règle A »): « Résultat obtenu » first, since « Avez-
-- vous obtenu ce que vous étiez venu(e) chercher ? » is the main question.
-- The pages sort by the category's position, then by the topic's or the
-- list's own order: topic.position now only orders the topics of a category.
UPDATE evaluation_category SET position = CASE code
  WHEN 'OUTCOME' THEN 1 WHEN 'STAFF' THEN 2 WHEN 'DELAYS' THEN 3 WHEN 'PROCEDURE' THEN 4
  WHEN 'COST' THEN 5 WHEN 'SERVICE_QUALITY' THEN 6 WHEN 'PREMISES' THEN 7 END;
