-- Review of the questionnaire (docs/analyse-questionnaire.md, 2026-10-03).

-- The driving licence and registration centre is a service with a file, not
-- transport: it was offered « Sécurité à bord » and « État des véhicules » but
-- not « Délai de traitement du dossier » (validated on 2026-10-03). Its
-- questions do not change: the Administration list is FILE_SERVICES, the
-- list it already had.
UPDATE establishment_type
SET sector_id = (SELECT id FROM sector WHERE code = 'ADMINISTRATION')
WHERE code = 'DRIVING_LICENCE_CENTER';

-- « des locaux » dropped: the topic also fits a bus, a boat or a plane.
UPDATE topic_translation SET label = 'Propreté et confort'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'CLEANLINESS');

-- Three topics of the schools, after the Education ones.
INSERT INTO topic (code, position) VALUES
  ('SCHOOL_SAFETY', 39),
  ('SCHOOL_EQUIPMENT', 40),
  ('PARENT_COMMUNICATION', 41);

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('SCHOOL_SAFETY', 'Sécurité dans l''établissement'),
  ('SCHOOL_EQUIPMENT', 'Tables-bancs, matériel et manuels'),
  ('PARENT_COMMUNICATION', 'Échanges avec les enseignants et la direction')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

-- ---------------------------------------------------------------------------
-- Topics in lists, like the questions (validated on 2026-10-03)
-- ---------------------------------------------------------------------------
-- What a feedback shows on screen 2b is the sum of lists, never a removal:
-- the COMMON list, then the list of its sector, of its establishment type and
-- of its service (topic_set_id on each, like question_set_id). GENERIC when
-- the sector is unknown. A topic in several lists shows once, in the order of
-- topic.position (« Autre » last). A list can be shared: SCHOOL is written
-- once for four types, FILE_SERVICES for four sectors.
-- Replaces topic_sector (a topic without rows was common to all), with the
-- same topics as validated: « Simplicité de la démarche » only where there
-- are papers, « Horaires d'ouverture » not for a trip, the schools' own list.

CREATE TABLE topic_set (
  id   smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE
);

CREATE TABLE topic_set_item (
  topic_set_id smallint NOT NULL REFERENCES topic_set (id),
  topic_id     smallint NOT NULL REFERENCES topic (id),
  PRIMARY KEY (topic_set_id, topic_id)
);

ALTER TABLE sector ADD COLUMN topic_set_id smallint REFERENCES topic_set (id);
ALTER TABLE establishment_type ADD COLUMN topic_set_id smallint REFERENCES topic_set (id);
ALTER TABLE service ADD COLUMN topic_set_id smallint REFERENCES topic_set (id);

INSERT INTO topic_set (code) VALUES
  ('COMMON'), ('GENERIC'), ('FILE_SERVICES'), ('SECURITY'), ('BANKING_INSURANCE'),
  ('ELECTRICITY'), ('WATER'), ('TELECOM'), ('HEALTH'), ('REAL_ESTATE'),
  ('EDUCATION'), ('SCHOOL'), ('TRANSPORT'), ('TRANSPORT_PLACE');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  -- For everyone.
  ('COMMON', 'STAFF'), ('COMMON', 'PROFESSIONALISM'), ('COMMON', 'FEES'),
  ('COMMON', 'CLEANLINESS'), ('COMMON', 'ACCESS_FOR_ALL'), ('COMMON', 'OTHER'),
  -- A counter: shops, restaurants, hotels, culture, sport, tourism, the
  -- other education places, and a sector unknown.
  ('GENERIC', 'WAIT_TIME'), ('GENERIC', 'INFORMATION'), ('GENERIC', 'OPENING_HOURS'),
  -- Administration, justice, taxes, social.
  ('FILE_SERVICES', 'WAIT_TIME'), ('FILE_SERVICES', 'INFORMATION'), ('FILE_SERVICES', 'PROCEDURE'),
  ('FILE_SERVICES', 'OPENING_HOURS'), ('FILE_SERVICES', 'PROCESSING_TIME'), ('FILE_SERVICES', 'CASE_TRACKING'),
  ('SECURITY', 'WAIT_TIME'), ('SECURITY', 'INFORMATION'), ('SECURITY', 'PROCEDURE'),
  ('SECURITY', 'OPENING_HOURS'), ('SECURITY', 'REQUEST_HANDLING'), ('SECURITY', 'RIGHTS_RESPECT'),
  ('SECURITY', 'PROCESSING_TIME'), ('SECURITY', 'CASE_TRACKING'),
  ('BANKING_INSURANCE', 'WAIT_TIME'), ('BANKING_INSURANCE', 'INFORMATION'), ('BANKING_INSURANCE', 'PROCEDURE'),
  ('BANKING_INSURANCE', 'OPENING_HOURS'), ('BANKING_INSURANCE', 'PROCESSING_TIME'),
  ('BANKING_INSURANCE', 'CASE_TRACKING'), ('BANKING_INSURANCE', 'CUSTOMER_SERVICE'),
  ('ELECTRICITY', 'WAIT_TIME'), ('ELECTRICITY', 'INFORMATION'), ('ELECTRICITY', 'PROCEDURE'),
  ('ELECTRICITY', 'OPENING_HOURS'), ('ELECTRICITY', 'POWER_CUTS'), ('ELECTRICITY', 'INTERVENTION_TIME'),
  ('ELECTRICITY', 'BILLING'), ('ELECTRICITY', 'CUSTOMER_SERVICE'),
  ('WATER', 'WAIT_TIME'), ('WATER', 'INFORMATION'), ('WATER', 'PROCEDURE'), ('WATER', 'OPENING_HOURS'),
  ('WATER', 'WATER_CUTS'), ('WATER', 'WATER_QUALITY'), ('WATER', 'BILLING'), ('WATER', 'CUSTOMER_SERVICE'),
  ('TELECOM', 'WAIT_TIME'), ('TELECOM', 'INFORMATION'), ('TELECOM', 'PROCEDURE'), ('TELECOM', 'OPENING_HOURS'),
  ('TELECOM', 'NETWORK_QUALITY'), ('TELECOM', 'BILLING'), ('TELECOM', 'CUSTOMER_SERVICE'),
  ('HEALTH', 'WAIT_TIME'), ('HEALTH', 'INFORMATION'), ('HEALTH', 'OPENING_HOURS'),
  ('HEALTH', 'CARE_RECEIVED'), ('HEALTH', 'MEDICINE_AVAILABILITY'), ('HEALTH', 'PRIVACY'),
  ('REAL_ESTATE', 'WAIT_TIME'), ('REAL_ESTATE', 'INFORMATION'), ('REAL_ESTATE', 'PROCEDURE'),
  ('REAL_ESTATE', 'OPENING_HOURS'),
  -- Every education place; the counter topics come from the type (GENERIC),
  -- except in the schools, where a pupil in class does not wait at a counter.
  ('EDUCATION', 'PROCEDURE'), ('EDUCATION', 'TEACHING_QUALITY'), ('EDUCATION', 'STUDENT_SUPERVISION'),
  ('SCHOOL', 'SCHOOL_SAFETY'), ('SCHOOL', 'SCHOOL_EQUIPMENT'), ('SCHOOL', 'PARENT_COMMUNICATION'),
  -- Every trip and transport place; a trip has no opening hours, a place does.
  ('TRANSPORT', 'WAIT_TIME'), ('TRANSPORT', 'INFORMATION'), ('TRANSPORT', 'PUNCTUALITY'),
  ('TRANSPORT', 'ONBOARD_SAFETY'), ('TRANSPORT', 'VEHICLE_CONDITION'), ('TRANSPORT', 'CUSTOMER_SERVICE'),
  ('TRANSPORT_PLACE', 'OPENING_HOURS')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

UPDATE sector s SET topic_set_id = ts.id
FROM (VALUES
  ('ADMINISTRATION', 'FILE_SERVICES'), ('JUSTICE', 'FILE_SERVICES'), ('TAX', 'FILE_SERVICES'),
  ('SOCIAL', 'FILE_SERVICES'), ('SECURITY', 'SECURITY'), ('BANKING_INSURANCE', 'BANKING_INSURANCE'),
  ('ELECTRICITY', 'ELECTRICITY'), ('WATER', 'WATER'), ('TELECOM', 'TELECOM'), ('HEALTH', 'HEALTH'),
  ('REAL_ESTATE', 'REAL_ESTATE'), ('EDUCATION', 'EDUCATION'), ('TRANSPORT', 'TRANSPORT'),
  ('CULTURE', 'GENERIC'), ('FOOD_SERVICE', 'GENERIC'), ('HOSPITALITY', 'GENERIC'),
  ('RETAIL', 'GENERIC'), ('SPORT', 'GENERIC'), ('TOURISM', 'GENERIC')
) AS v (sector, list)
JOIN topic_set ts ON ts.code = v.list
WHERE s.code = v.sector;

UPDATE establishment_type et SET topic_set_id = ts.id
FROM (VALUES
  ('HIGH_SCHOOL', 'SCHOOL'), ('MIDDLE_SCHOOL', 'SCHOOL'), ('PRIMARY_SCHOOL', 'SCHOOL'),
  ('SCHOOL_GROUP', 'SCHOOL'),
  ('UNIVERSITY', 'GENERIC'), ('HIGHER_EDUCATION_SCHOOL', 'GENERIC'), ('VOCATIONAL_TRAINING_CENTER', 'GENERIC'),
  ('PRESCHOOL', 'GENERIC'), ('DAARA', 'GENERIC'),
  ('AIRPORT', 'TRANSPORT_PLACE'), ('BUS_STATION', 'TRANSPORT_PLACE')
) AS v (type, list)
JOIN topic_set ts ON ts.code = v.list
WHERE et.code = v.type;

UPDATE service sv SET topic_set_id = ts.id
FROM (VALUES ('TICKET_PURCHASE', 'TRANSPORT_PLACE'), ('PLANE_TICKET', 'TRANSPORT_PLACE')) AS v (service, list)
JOIN topic_set ts ON ts.code = v.list
WHERE sv.code = v.service;

DROP TABLE topic_sector;
