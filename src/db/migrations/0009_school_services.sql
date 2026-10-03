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
