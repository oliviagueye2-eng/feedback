-- 0062: how the user came to the airport, and the parking (decided by Olivia,
-- 2026-10-09). Before the wait at the checks, in the airport's own list.
--   ARRIVAL_MODE: a fact, no category, no value;
--   PARKING_EASE: after « Véhicule personnel », valued like TRANSPORT_ACCESS.

INSERT INTO question (code, type) VALUES ('ARRIVAL_MODE', 'single_choice');

INSERT INTO question (code, type, category_id)
SELECT 'PARKING_EASE', 'single_choice', id FROM evaluation_category WHERE code = 'PREMISES';

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('ARRIVAL_MODE', 'Comment êtes-vous venu(e) à l''aéroport ?'),
  ('PARKING_EASE', 'Avez-vous trouvé facilement une place de parking ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('ARRIVAL_MODE', 'OWN_VEHICLE', NULL::smallint, 1), ('ARRIVAL_MODE', 'TAXI', NULL, 2), ('ARRIVAL_MODE', 'APP_RIDE', NULL, 3),
  ('ARRIVAL_MODE', 'BUS', NULL, 4), ('ARRIVAL_MODE', 'TER', NULL, 5), ('ARRIVAL_MODE', 'OTHER', NULL, 6),
  ('PARKING_EASE', 'YES', 3, 1), ('PARKING_EASE', 'WITH_DIFFICULTY', 2, 2), ('PARKING_EASE', 'NO', 1, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('ARRIVAL_MODE', 'OWN_VEHICLE', 'Véhicule personnel'), ('ARRIVAL_MODE', 'TAXI', 'Taxi'),
  ('ARRIVAL_MODE', 'APP_RIDE', 'VTC'), ('ARRIVAL_MODE', 'BUS', 'Bus'), ('ARRIVAL_MODE', 'TER', 'TER'),
  ('ARRIVAL_MODE', 'OTHER', 'Autre'),
  ('PARKING_EASE', 'YES', 'Oui'), ('PARKING_EASE', 'WITH_DIFFICULTY', 'Avec difficulté'), ('PARKING_EASE', 'NO', 'Non')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

UPDATE question_set_item SET position = position + 2
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'AIRPORT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('ARRIVAL_MODE', 1), ('PARKING_EASE', 2)) AS v (question, position)
JOIN question_set qs ON qs.code = 'AIRPORT'
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, d.id, ao.id
FROM question_set qs, question q, question d
JOIN answer_option ao ON ao.question_id = d.id AND ao.code = 'OWN_VEHICLE'
WHERE qs.code = 'AIRPORT' AND q.code = 'PARKING_EASE' AND d.code = 'ARRIVAL_MODE';
