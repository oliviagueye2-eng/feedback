-- Taxis and ride-hailing (validated on 2026-10-04,
-- /mnt/project-files/questionnaire/taxis-vtc.md). One service per mode: a ride
-- ordered in an app (Yango, Heetch) has its own questions on the app, the
-- price shown and the driver shown; a street taxi (yellow and black) on the
-- wait to find one and the price agreed. Both get the trips' topics (TRIP),
-- like the bus, the boat and the plane; nothing of the stop, the crowd or the
-- ticket.

-- ---------------------------------------------------------------------------
-- The two apps and the street taxis, rated « in general » like Air Sénégal (0006)
-- ---------------------------------------------------------------------------
-- The street taxis have no operator: nobody receives their results yet (the
-- body behind the platform, later), they are published like the others.
INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, NULL, s.id
FROM (VALUES ('YANGO', 'Yango'), ('HEETCH', 'Heetch'), ('STREET_TAXI', 'Taxis jaunes et noirs')) AS v (code, name)
JOIN sector s ON s.code = 'TRANSPORT';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases::text[], o.id, 'general', o.sector_id
FROM (VALUES
  ('YANGO', '{Yango Taxi,taxi,VTC}'),
  ('HEETCH', '{taxi,VTC}'),
  ('STREET_TAXI', '{taxi,taxi jaune,taxi jaune et noir,taxi de rue}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES
  ('DRIVER_WAIT', 'DELAYS'),
  ('PRICE_AS_SHOWN', 'COST'),
  ('DRIVER_AS_SHOWN', 'PREMISES'),
  ('TAXI_WAIT', 'DELAYS'),
  ('PRICE_AGREED', 'COST'),
  ('PRICE_KEPT', 'COST')
) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('DRIVER_WAIT', 'Combien de temps avez-vous attendu le chauffeur ?'),
  ('PRICE_AS_SHOWN', 'Avez-vous payé le prix affiché dans l''application ?'),
  ('DRIVER_AS_SHOWN', 'La voiture et le chauffeur étaient-ils ceux affichés dans l''application ?'),
  ('TAXI_WAIT', 'Combien de temps avez-vous attendu pour trouver un taxi ?'),
  ('PRICE_AGREED', 'Le prix a-t-il été fixé avant de partir ?'),
  ('PRICE_KEPT', 'Le chauffeur a-t-il respecté le prix convenu ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  -- Longer is worse, like the other waits.
  ('DRIVER_WAIT', 'UNDER_5_MIN', 1, 1),
  ('DRIVER_WAIT', '5_TO_15_MIN', 2, 2),
  ('DRIVER_WAIT', '15_TO_30_MIN', 3, 3),
  ('DRIVER_WAIT', 'OVER_30_MIN', 4, 4),
  -- Paying less is not better service: outside the scale.
  ('PRICE_AS_SHOWN', 'YES', 2, 1),
  ('PRICE_AS_SHOWN', 'HIGHER', 1, 2),
  ('PRICE_AS_SHOWN', 'LOWER', NULL, 3),
  ('DRIVER_AS_SHOWN', 'YES', 2, 1),
  ('DRIVER_AS_SHOWN', 'NO', 1, 2),
  ('TAXI_WAIT', 'UNDER_5_MIN', 1, 1),
  ('TAXI_WAIT', '5_TO_15_MIN', 2, 2),
  ('TAXI_WAIT', '15_TO_30_MIN', 3, 3),
  ('TAXI_WAIT', 'OVER_30_MIN', 4, 4),
  -- A fact, not better or worse: it opens the next question.
  ('PRICE_AGREED', 'YES', NULL, 1),
  ('PRICE_AGREED', 'NO', NULL, 2),
  ('PRICE_KEPT', 'YES', 2, 1),
  ('PRICE_KEPT', 'HIGHER', 1, 2)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM (VALUES
  ('DRIVER_WAIT', 'UNDER_5_MIN', 'Moins de 5 minutes'),
  ('DRIVER_WAIT', '5_TO_15_MIN', '5 à 15 minutes'),
  ('DRIVER_WAIT', '15_TO_30_MIN', '15 à 30 minutes'),
  ('DRIVER_WAIT', 'OVER_30_MIN', 'Plus de 30 minutes'),
  ('PRICE_AS_SHOWN', 'YES', 'Oui'),
  ('PRICE_AS_SHOWN', 'HIGHER', 'Non, plus cher'),
  ('PRICE_AS_SHOWN', 'LOWER', 'Non, moins cher'),
  ('DRIVER_AS_SHOWN', 'YES', 'Oui'),
  ('DRIVER_AS_SHOWN', 'NO', 'Non'),
  ('TAXI_WAIT', 'UNDER_5_MIN', 'Moins de 5 minutes'),
  ('TAXI_WAIT', '5_TO_15_MIN', '5 à 15 minutes'),
  ('TAXI_WAIT', '15_TO_30_MIN', '15 à 30 minutes'),
  ('TAXI_WAIT', 'OVER_30_MIN', 'Plus de 30 minutes'),
  ('PRICE_AGREED', 'YES', 'Oui'),
  ('PRICE_AGREED', 'NO', 'Non'),
  ('PRICE_KEPT', 'YES', 'Oui'),
  ('PRICE_KEPT', 'HIGHER', 'Non, il a demandé plus')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

INSERT INTO question_set (code) VALUES ('APP_RIDE'), ('STREET_TAXI_RIDE');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('APP_RIDE', 'DRIVER_WAIT', 1),
  ('APP_RIDE', 'PRICE_AS_SHOWN', 2),
  ('APP_RIDE', 'DRIVER_AS_SHOWN', 3),
  ('STREET_TAXI_RIDE', 'TAXI_WAIT', 1),
  ('STREET_TAXI_RIDE', 'PRICE_AGREED', 2),
  ('STREET_TAXI_RIDE', 'PRICE_KEPT', 3)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- The price kept only after a price agreed.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM question_set qs, question q, question dq
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = 'YES'
WHERE qs.code = 'STREET_TAXI_RIDE' AND q.code = 'PRICE_KEPT' AND dq.code = 'PRICE_AGREED';

-- ---------------------------------------------------------------------------
-- The two services
-- ---------------------------------------------------------------------------
INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[]
FROM (VALUES
  ('APP_RIDE', 'APP_RIDE', '{course,taxi,VTC,chauffeur,application}'),
  ('STREET_TAXI_RIDE', 'STREET_TAXI_RIDE', '{course,taxi,taxi jaune,chauffeur}')
) AS v (code, list, synonyms)
JOIN sector s ON s.code = 'TRANSPORT'
JOIN topic_set ts ON ts.code = 'TRIP'
JOIN question_set qs ON qs.code = v.list;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES ('APP_RIDE', 'Une course en VTC'), ('STREET_TAXI_RIDE', 'Une course en taxi')) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN organization o ON o.id = e.organization_id
JOIN service s ON s.code = CASE o.code WHEN 'STREET_TAXI' THEN 'STREET_TAXI_RIDE' ELSE 'APP_RIDE' END
WHERE o.code IN ('YANGO', 'HEETCH', 'STREET_TAXI');
