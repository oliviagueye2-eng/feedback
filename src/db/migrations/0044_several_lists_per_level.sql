-- 0044: several lists per level (decided by Olivia, 2026-10-09).
-- A sector, an establishment type or a service had one topic list and one
-- question list (topic_set_id, question_set_id). A special case meant copying
-- a list (TRIP, then ROAD_TRIP, then the VTC's): a change had to be made again
-- in each copy. Now each level takes any number of lists, in order
-- (position): small shared lists are combined instead of copied. The form
-- adds them up as before. Each current list becomes the level's first one.

CREATE TABLE sector_topic_set (
  sector_id smallint NOT NULL REFERENCES sector (id) ON DELETE CASCADE,
  topic_set_id smallint NOT NULL REFERENCES topic_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (sector_id, topic_set_id),
  UNIQUE (sector_id, position)
);

INSERT INTO sector_topic_set (sector_id, topic_set_id, position)
SELECT id, topic_set_id, 1 FROM sector WHERE topic_set_id IS NOT NULL;

CREATE TABLE sector_question_set (
  sector_id smallint NOT NULL REFERENCES sector (id) ON DELETE CASCADE,
  question_set_id smallint NOT NULL REFERENCES question_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (sector_id, question_set_id),
  UNIQUE (sector_id, position)
);

INSERT INTO sector_question_set (sector_id, question_set_id, position)
SELECT id, question_set_id, 1 FROM sector WHERE question_set_id IS NOT NULL;

CREATE TABLE establishment_type_topic_set (
  type_id integer NOT NULL REFERENCES establishment_type (id) ON DELETE CASCADE,
  topic_set_id smallint NOT NULL REFERENCES topic_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (type_id, topic_set_id),
  UNIQUE (type_id, position)
);

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT id, topic_set_id, 1 FROM establishment_type WHERE topic_set_id IS NOT NULL;

CREATE TABLE establishment_type_question_set (
  type_id integer NOT NULL REFERENCES establishment_type (id) ON DELETE CASCADE,
  question_set_id smallint NOT NULL REFERENCES question_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (type_id, question_set_id),
  UNIQUE (type_id, position)
);

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT id, question_set_id, 1 FROM establishment_type WHERE question_set_id IS NOT NULL;

CREATE TABLE service_topic_set (
  service_id integer NOT NULL REFERENCES service (id) ON DELETE CASCADE,
  topic_set_id smallint NOT NULL REFERENCES topic_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (service_id, topic_set_id),
  UNIQUE (service_id, position)
);

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT id, topic_set_id, 1 FROM service WHERE topic_set_id IS NOT NULL;

CREATE TABLE service_question_set (
  service_id integer NOT NULL REFERENCES service (id) ON DELETE CASCADE,
  question_set_id smallint NOT NULL REFERENCES question_set (id),
  position smallint NOT NULL,
  PRIMARY KEY (service_id, question_set_id),
  UNIQUE (service_id, position)
);

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT id, question_set_id, 1 FROM service WHERE question_set_id IS NOT NULL;

ALTER TABLE sector DROP COLUMN topic_set_id, DROP COLUMN question_set_id;

ALTER TABLE establishment_type DROP COLUMN topic_set_id, DROP COLUMN question_set_id;

ALTER TABLE service DROP COLUMN topic_set_id, DROP COLUMN question_set_id;
