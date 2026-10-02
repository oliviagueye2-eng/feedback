-- An establishment type can have its own detailed questionnaire (validated
-- 2026-10-01), between the service's and the sector's: the questions follow
-- service → establishment type → sector → GENERIC. First use: the airport
-- AIBD, in the Transport sector, must not get the bus questions (stop, crowded
-- vehicle, ticket). Its type « Aéroport » gets an empty questionnaire for now
-- (no question page of its own), real airport questions to come.

ALTER TABLE establishment_type
  ADD COLUMN detailed_questionnaire_id int REFERENCES questionnaire (id);

INSERT INTO questionnaire (code, version, status, published_at)
VALUES ('AIRPORT', 1, 'published', now());

INSERT INTO establishment_type (code, sector_id, detailed_questionnaire_id)
SELECT 'AIRPORT', s.id, (SELECT id FROM questionnaire WHERE code = 'AIRPORT' AND version = 1)
FROM sector s WHERE s.code = 'TRANSPORT';

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT id, 'fr', 'Aéroport' FROM establishment_type WHERE code = 'AIRPORT';

UPDATE establishment
SET type_id = (SELECT id FROM establishment_type WHERE code = 'AIRPORT')
WHERE name = 'Aéroport international Blaise Diagne';
