-- A school is rated for two different visits (validated on 2026-10-03): the
-- enrolment or a paper at the office (reception, papers, fees), and the
-- school year (classes, supervision, safety). One service each, chosen on
-- screen 1 like « Un vol » for Air Sénégal; each brings its own topics.

UPDATE topic_translation SET label = 'Accessibilité aux personnes handicapées ou âgées'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'ACCESS_FOR_ALL');

-- « Accueil et politesse » and « Frais payés » leave the COMMON list (a pupil
-- in class pays nothing at a counter) and go to every list a sector or a type
-- other than a school uses: nothing changes on screen for these places.
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'COMMON')
  AND topic_id IN (SELECT id FROM topic WHERE code IN ('STAFF', 'FEES'));

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM topic_set s, topic t
WHERE s.code IN ('GENERIC', 'FILE_SERVICES', 'SECURITY', 'BANKING_INSURANCE', 'ELECTRICITY', 'WATER',
                 'TELECOM', 'HEALTH', 'REAL_ESTATE', 'TRANSPORT')
  AND t.code IN ('STAFF', 'FEES');

-- The Education list (papers, teaching, supervision) went to every education
-- place, schools included: it moves to the other education types, with the
-- counter topics they had from GENERIC. The Education sector then has no list.
INSERT INTO topic_set (code) VALUES ('OTHER_EDUCATION'), ('SCHOOL_ADMIN');
UPDATE topic_set SET code = 'SCHOOL_LIFE' WHERE code = 'SCHOOL';

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('OTHER_EDUCATION', 'STAFF'), ('OTHER_EDUCATION', 'WAIT_TIME'), ('OTHER_EDUCATION', 'INFORMATION'),
  ('OTHER_EDUCATION', 'PROCEDURE'), ('OTHER_EDUCATION', 'OPENING_HOURS'), ('OTHER_EDUCATION', 'FEES'),
  ('OTHER_EDUCATION', 'TEACHING_QUALITY'), ('OTHER_EDUCATION', 'STUDENT_SUPERVISION'),
  ('SCHOOL_ADMIN', 'STAFF'), ('SCHOOL_ADMIN', 'WAIT_TIME'), ('SCHOOL_ADMIN', 'INFORMATION'),
  ('SCHOOL_ADMIN', 'PROCEDURE'), ('SCHOOL_ADMIN', 'OPENING_HOURS'), ('SCHOOL_ADMIN', 'FEES'),
  ('SCHOOL_LIFE', 'TEACHING_QUALITY'), ('SCHOOL_LIFE', 'STUDENT_SUPERVISION')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

UPDATE establishment_type SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'OTHER_EDUCATION')
WHERE code IN ('UNIVERSITY', 'HIGHER_EDUCATION_SCHOOL', 'VOCATIONAL_TRAINING_CENTER', 'PRESCHOOL', 'DAARA');

-- The schools' topics now come from the service chosen.
UPDATE establishment_type SET topic_set_id = NULL
WHERE code IN ('HIGH_SCHOOL', 'MIDDLE_SCHOOL', 'PRIMARY_SCHOOL', 'SCHOOL_GROUP');

UPDATE sector SET topic_set_id = NULL WHERE code = 'EDUCATION';
DELETE FROM topic_set_item WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'EDUCATION');
DELETE FROM topic_set WHERE code = 'EDUCATION';

-- The two services, offered by every school (a school added later gets them
-- too, like the services of an operator).
INSERT INTO service (code, sector_id, topic_set_id, synonyms)
SELECT v.code, s.id, ts.id, v.synonyms::text[]
FROM (VALUES
  ('SCHOOL_ADMIN', 'SCHOOL_ADMIN', '{inscription,réinscription,certificat de scolarité,transfert}'),
  ('SCHOOL_LIFE', 'SCHOOL_LIFE', '{cours,classe,professeur,enseignant}')
) AS v (code, list, synonyms)
JOIN sector s ON s.code = 'EDUCATION'
JOIN topic_set ts ON ts.code = v.list;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('SCHOOL_ADMIN', 'Inscription ou démarche administrative'),
  ('SCHOOL_LIFE', 'Les cours et la vie de l''école')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN establishment_type et ON et.id = e.type_id
  AND et.code IN ('HIGH_SCHOOL', 'MIDDLE_SCHOOL', 'PRIMARY_SCHOOL', 'SCHOOL_GROUP')
JOIN service s ON s.code IN ('SCHOOL_ADMIN', 'SCHOOL_LIFE');

-- « Propreté, entretien et confort » (validated on 2026-10-03) also says the
-- state of a bus, a boat or a plane, so « État des véhicules », a word that
-- did not fit a plane or a boat, is no longer offered for the trips.
UPDATE topic_translation SET label = 'Propreté, entretien et confort'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'CLEANLINESS');

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT')
  AND topic_id = (SELECT id FROM topic WHERE code = 'VEHICLE_CONDITION');

-- A trip has « Ponctualité »: « Temps d'attente » said the same (validated on
-- 2026-10-03). The transport places and the ticket counters keep it.
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT')
  AND topic_id = (SELECT id FROM topic WHERE code = 'WAIT_TIME');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'TRANSPORT_PLACE' AND t.code = 'WAIT_TIME';

-- « Ponctualité » and « Sécurité à bord » rate a trip, not a place nor a
-- ticket counter (validated on 2026-10-03): they leave the Transport list,
-- that the airport and the bus stations get, for the trips' own list. Every
-- operator offers its trip as a service; « Autre démarche » is not a trip.
INSERT INTO topic_set (code) VALUES ('TRIP');

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT')
  AND topic_id IN (SELECT id FROM topic WHERE code IN ('PUNCTUALITY', 'ONBOARD_SAFETY'));

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'TRIP' AND t.code IN ('PUNCTUALITY', 'ONBOARD_SAFETY');

UPDATE service SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRIP')
WHERE code IN ('FLIGHT', 'LAND_TRIP', 'BOAT_CROSSING');

-- Two topics close in words, not in cause (validated on 2026-10-03): what the
-- staff explained, and how heavy the procedure itself is.
UPDATE topic_translation tr SET label = v.label
FROM (VALUES
  ('INFORMATION', 'Explications du personnel (claires, complètes)'),
  ('PROCEDURE', 'Simplicité de la démarche (nombre de papiers nécessaires, allers-retours)')
) AS v (code, label)
JOIN topic t ON t.code = v.code
WHERE tr.topic_id = t.id AND tr.language = 'fr';

-- ---------------------------------------------------------------------------
-- Evaluation categories (validated on 2026-10-03)
-- ---------------------------------------------------------------------------
-- One list shared by the topics and the questions, so that a result per
-- category (« Délais ») adds the topic « Temps d'attente » to the question
-- « Combien de temps avez-vous attendu ? ». No title on screen: the topics are
-- only shown in the order of the categories (topic.position renumbered).
-- Without a category: the overall satisfaction, « Recommanderiez-vous… ? » and
-- the profile questions (who, about what, class size, reported or not).
CREATE TABLE evaluation_category (
  id       smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code     text NOT NULL UNIQUE,
  position smallint NOT NULL
);

CREATE TABLE evaluation_category_translation (
  evaluation_category_id smallint NOT NULL REFERENCES evaluation_category (id) ON DELETE CASCADE,
  language               text NOT NULL,
  label                  text NOT NULL,
  PRIMARY KEY (evaluation_category_id, language)
);

ALTER TABLE topic ADD COLUMN category_id smallint REFERENCES evaluation_category (id);
ALTER TABLE question ADD COLUMN category_id smallint REFERENCES evaluation_category (id);

INSERT INTO evaluation_category (code, position) VALUES
  ('STAFF', 1), ('DELAYS', 2), ('PROCEDURE', 3), ('COST', 4), ('OUTCOME', 5),
  ('SERVICE_QUALITY', 6), ('PREMISES', 7);

INSERT INTO evaluation_category_translation (evaluation_category_id, language, label)
SELECT c.id, 'fr', v.label
FROM (VALUES
  ('STAFF', 'Personnel'),
  ('DELAYS', 'Délais'),
  ('PROCEDURE', 'Démarche et information'),
  ('COST', 'Coût et transparence'),
  ('OUTCOME', 'Résultat obtenu'),
  ('SERVICE_QUALITY', 'Qualité du service'),
  ('PREMISES', 'Locaux, équipements et sécurité')
) AS v (code, label)
JOIN evaluation_category c ON c.code = v.code;

-- Category and new place of each topic: ten per category, in the validated order.
UPDATE topic t SET category_id = c.id, position = v.position
FROM (VALUES
  ('STAFF', 'STAFF', 1), ('PROFESSIONALISM', 'STAFF', 2), ('INFORMATION', 'STAFF', 3),
  ('PRIVACY', 'STAFF', 4), ('RIGHTS_RESPECT', 'STAFF', 5), ('STUDENT_SUPERVISION', 'STAFF', 6),
  ('PARENT_COMMUNICATION', 'STAFF', 7),
  ('WAIT_TIME', 'DELAYS', 11), ('PROCESSING_TIME', 'DELAYS', 12), ('INTERVENTION_TIME', 'DELAYS', 13),
  ('PUNCTUALITY', 'DELAYS', 14),
  ('PROCEDURE', 'PROCEDURE', 21), ('CASE_TRACKING', 'PROCEDURE', 22), ('OPENING_HOURS', 'PROCEDURE', 23),
  ('CUSTOMER_SERVICE', 'PROCEDURE', 24),
  ('FEES', 'COST', 31), ('BILLING', 'COST', 32),
  ('CARE_RECEIVED', 'OUTCOME', 41), ('MEDICINE_AVAILABILITY', 'OUTCOME', 42), ('TEACHING_QUALITY', 'OUTCOME', 43),
  ('REQUEST_HANDLING', 'OUTCOME', 44),
  ('POWER_CUTS', 'SERVICE_QUALITY', 51), ('WATER_CUTS', 'SERVICE_QUALITY', 52),
  ('WATER_QUALITY', 'SERVICE_QUALITY', 53), ('NETWORK_QUALITY', 'SERVICE_QUALITY', 54),
  ('CLEANLINESS', 'PREMISES', 61), ('ACCESS_FOR_ALL', 'PREMISES', 62), ('ONBOARD_SAFETY', 'PREMISES', 63),
  ('SCHOOL_SAFETY', 'PREMISES', 64), ('SCHOOL_EQUIPMENT', 'PREMISES', 65), ('VEHICLE_CONDITION', 'PREMISES', 66)
) AS v (code, category, position)
JOIN evaluation_category c ON c.code = v.category
WHERE t.code = v.code;

UPDATE question q SET category_id = c.id
FROM (VALUES
  ('WAIT_TIME', 'DELAYS'), ('CHECKS_WAIT', 'DELAYS'), ('STOP_WAIT', 'DELAYS'), ('DEPARTURE_ON_TIME', 'DELAYS'),
  ('DOCUMENTS_KNOWN', 'PROCEDURE'), ('VISITS_COUNT', 'PROCEDURE'), ('WAYFINDING', 'PROCEDURE'),
  ('DELAY_INFORMED', 'PROCEDURE'), ('DELAY_CARE', 'PROCEDURE'), ('CUT_NOTICE', 'PROCEDURE'),
  ('RECEIPT_GIVEN', 'COST'), ('RECEIPT_OR_INVOICE', 'COST'), ('FEES_EXPLAINED', 'COST'), ('FAIR_PRICE', 'COST'),
  ('TICKET_GIVEN', 'COST'), ('PAYMENT_AS_WISHED', 'COST'),
  ('GOAL_ACHIEVED', 'OUTCOME'), ('CARE_RECEIVED', 'OUTCOME'), ('PRESCRIPTION_AVAILABLE', 'OUTCOME'),
  ('CLASSES_HELD', 'OUTCOME'), ('LUGGAGE', 'OUTCOME'),
  ('CUTS_COUNT', 'SERVICE_QUALITY'), ('DAYS_WITHOUT_WATER', 'SERVICE_QUALITY'), ('NETWORK_LOSS', 'SERVICE_QUALITY'),
  ('TOILETS', 'PREMISES'), ('FACILITIES', 'PREMISES'), ('SEAT_TO_WAIT', 'PREMISES'), ('TRANSPORT_ACCESS', 'PREMISES'),
  ('CROWDED', 'PREMISES'), ('SEAT_AS_BOOKED', 'PREMISES'), ('BOARDING', 'PREMISES'), ('SAFETY_BRIEFING', 'PREMISES')
) AS v (code, category)
JOIN evaluation_category c ON c.code = v.category
WHERE q.code = v.code;

-- « Professionnalisme » was vague next to « Explications du personnel »
-- (validated on 2026-10-03): the staff is rated on courtesy, communication
-- and competence, one topic each.
UPDATE topic_translation SET label = 'Compétence du personnel (connaît son travail, traite bien la demande)'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM');

-- The three staff topics read alike (validated on 2026-10-03).
UPDATE topic_translation SET label = 'Politesse du personnel (accueil, respect)'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'STAFF');
