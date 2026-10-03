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
