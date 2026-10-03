-- Review of the questionnaire (docs/analyse-questionnaire.md, 2026-10-03).

-- The driving licence and registration centre is a service with a file, not
-- transport: it was offered « Sécurité à bord » and « État des véhicules » but
-- not « Délai de traitement du dossier » (validated on 2026-10-03). Its
-- questions do not change: the Administration list is FILE_SERVICES, the
-- list it already had.
UPDATE establishment_type
SET sector_id = (SELECT id FROM sector WHERE code = 'ADMINISTRATION')
WHERE code = 'DRIVING_LICENCE_CENTER';

-- Topics by establishment type and by service, like the questions (option B,
-- validated on 2026-10-03). The sector gives the base list (topic_sector); a
-- type or a service can add a topic (shown = true) or remove one (shown =
-- false). The most specific level that names the topic decides: the service,
-- then the type, then the sector. E.g. the service « Un vol » removes
-- « Horaires d'ouverture », the type « Lycée » adds a topic of its own.
CREATE TABLE topic_establishment_type (
  topic_id              smallint NOT NULL REFERENCES topic (id),
  establishment_type_id int NOT NULL REFERENCES establishment_type (id),
  shown                 boolean NOT NULL,
  PRIMARY KEY (topic_id, establishment_type_id)
);

CREATE TABLE topic_service (
  topic_id   smallint NOT NULL REFERENCES topic (id),
  service_id int NOT NULL REFERENCES service (id),
  shown      boolean NOT NULL,
  PRIMARY KEY (topic_id, service_id)
);

-- Content validated on 2026-10-03 (points 1, 2 and 3).

-- 1. « Simplicité de la démarche (papiers, allers-retours) » only where there
-- are papers to bring: it stops being a common topic. Answers already given
-- elsewhere are kept.
INSERT INTO topic_sector (topic_id, sector_id)
SELECT t.id, s.id FROM topic t, sector s
WHERE t.code = 'PROCEDURE'
  AND s.code IN ('ADMINISTRATION', 'JUSTICE', 'TAX', 'SOCIAL', 'SECURITY', 'BANKING_INSURANCE',
                 'ELECTRICITY', 'WATER', 'TELECOM', 'EDUCATION', 'REAL_ESTATE');

-- 2. A trip has no opening hours: removed for a flight, a boat crossing and a
-- bus or train trip. Stations, the airport and ticket purchase keep it.
INSERT INTO topic_service (topic_id, service_id, shown)
SELECT t.id, s.id, false FROM topic t, service s
WHERE t.code = 'OPENING_HOURS' AND s.code IN ('FLIGHT', 'BOAT_CROSSING', 'LAND_TRIP');

-- 3. « des locaux » dropped: the topic also fits a bus, a boat or a plane.
UPDATE topic_translation SET label = 'Propreté et confort'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'CLEANLINESS');

-- Schools (validated on 2026-10-03): high school, middle school, primary
-- school and school group. Universities, nursery schools and daaras keep the
-- Education list for now.
-- Removed: a pupil in class does not wait at a counter, has no opening hours,
-- and « Explications reçues » is too vague there (replaced by the
-- communication with parents).
INSERT INTO topic_establishment_type (topic_id, establishment_type_id, shown)
SELECT t.id, et.id, false FROM topic t, establishment_type et
WHERE t.code IN ('WAIT_TIME', 'OPENING_HOURS', 'INFORMATION')
  AND et.code IN ('HIGH_SCHOOL', 'MIDDLE_SCHOOL', 'PRIMARY_SCHOOL', 'SCHOOL_GROUP');

-- Added: three topics of their own, after the Education ones.
INSERT INTO topic (code, position) VALUES
  ('SCHOOL_SAFETY', 39),
  ('SCHOOL_EQUIPMENT', 40),
  ('PARENT_COMMUNICATION', 41);

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('SCHOOL_SAFETY', 'Sécurité dans l''établissement'),
  ('SCHOOL_EQUIPMENT', 'Tables-bancs, matériel et manuels'),
  ('PARENT_COMMUNICATION', 'Communication avec les parents')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_establishment_type (topic_id, establishment_type_id, shown)
SELECT t.id, et.id, true FROM topic t, establishment_type et
WHERE t.code IN ('SCHOOL_SAFETY', 'SCHOOL_EQUIPMENT', 'PARENT_COMMUNICATION')
  AND et.code IN ('HIGH_SCHOOL', 'MIDDLE_SCHOOL', 'PRIMARY_SCHOOL', 'SCHOOL_GROUP');
