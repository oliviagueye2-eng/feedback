-- 0046: the topics that always come together become shared lists, « blocks »
-- (decided by Olivia, 2026-10-09). A block is added to a level instead of
-- its topics being copied in each list:
--   STAFF_SKILLS « Personnel »: Compétence du personnel, Explications du personnel;
--   COUNTER « Guichet »: Temps d'attente, Horaires d'ouverture;
--   CASE_FILE « Dossier »: Simplicité de la démarche, Délai de traitement, Suivi du dossier;
--   PREMISES « Locaux »: Propreté, entretien et confort, Accessibilité;
--   FEES « Frais »: Frais payés.
-- A list holding all the topics of a block loses them, and every level using
-- it gets the block instead. A list holding only some keeps them (« Simplicité
-- de la démarche » alone, « Temps d'attente » without opening hours: 1A).
-- COMMERCE keeps its topics: the code gives it when the sector is unknown (4A).
-- A list left empty goes. The police station gets « Personnel » (3), the only
-- change a user sees.

CREATE TEMPORARY TABLE block (code text, rank int, topic text);
INSERT INTO block VALUES
  ('STAFF_SKILLS', 1, 'PROFESSIONALISM'), ('STAFF_SKILLS', 1, 'INFORMATION'),
  ('COUNTER', 2, 'WAIT_TIME'), ('COUNTER', 2, 'OPENING_HOURS'),
  ('CASE_FILE', 3, 'PROCEDURE'), ('CASE_FILE', 3, 'PROCESSING_TIME'), ('CASE_FILE', 3, 'CASE_TRACKING'),
  ('PREMISES', 4, 'CLEANLINESS'), ('PREMISES', 4, 'ACCESS_FOR_ALL'),
  ('FEES', 5, 'FEES');

INSERT INTO topic_set (code) SELECT DISTINCT code FROM block;

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM block b JOIN topic_set s ON s.code = b.code JOIN topic t ON t.code = b.topic;

-- Each list holding a whole block (COMMERCE and the blocks themselves aside).
CREATE TEMPORARY TABLE replaced AS
SELECT l.id AS list_id, s.id AS block_id, b.rank
FROM topic_set l
JOIN (SELECT DISTINCT code, rank FROM block) b ON true
JOIN topic_set s ON s.code = b.code
WHERE l.code NOT IN ('COMMERCE', 'COMMON') AND l.code NOT IN (SELECT code FROM block)
  AND NOT EXISTS (SELECT 1 FROM block x JOIN topic t ON t.code = x.topic
                  WHERE x.code = b.code
                    AND NOT EXISTS (SELECT 1 FROM topic_set_item i WHERE i.topic_set_id = l.id AND i.topic_id = t.id));

-- The police station: « Personnel » with its other blocks (3).
INSERT INTO replaced
SELECT l.id, s.id, 1 FROM topic_set l, topic_set s WHERE l.code = 'POLICE_PREMISES' AND s.code = 'STAFF_SKILLS';

-- Every level using such a list gets its blocks, after its own lists, in the blocks' order.
INSERT INTO sector_topic_set (sector_id, topic_set_id, position)
SELECT b.sector_id, b.block_id,
       (SELECT max(position) FROM sector_topic_set m WHERE m.sector_id = b.sector_id)
       + row_number() OVER (PARTITION BY b.sector_id ORDER BY b.rank)
FROM (SELECT DISTINCT x.sector_id, r.block_id, r.rank
      FROM sector_topic_set x JOIN replaced r ON r.list_id = x.topic_set_id
      WHERE NOT EXISTS (SELECT 1 FROM sector_topic_set y WHERE y.sector_id = x.sector_id AND y.topic_set_id = r.block_id)) b;

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT b.type_id, b.block_id,
       (SELECT max(position) FROM establishment_type_topic_set m WHERE m.type_id = b.type_id)
       + row_number() OVER (PARTITION BY b.type_id ORDER BY b.rank)
FROM (SELECT DISTINCT x.type_id, r.block_id, r.rank
      FROM establishment_type_topic_set x JOIN replaced r ON r.list_id = x.topic_set_id
      WHERE NOT EXISTS (SELECT 1 FROM establishment_type_topic_set y WHERE y.type_id = x.type_id AND y.topic_set_id = r.block_id)) b;

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT b.service_id, b.block_id,
       (SELECT max(position) FROM service_topic_set m WHERE m.service_id = b.service_id)
       + row_number() OVER (PARTITION BY b.service_id ORDER BY b.rank)
FROM (SELECT DISTINCT x.service_id, r.block_id, r.rank
      FROM service_topic_set x JOIN replaced r ON r.list_id = x.topic_set_id
      WHERE NOT EXISTS (SELECT 1 FROM service_topic_set y WHERE y.service_id = x.service_id AND y.topic_set_id = r.block_id)) b;

-- The lists lose the blocks' topics.
DELETE FROM topic_set_item i
USING replaced r, block b, topic_set s, topic t
WHERE i.topic_set_id = r.list_id AND s.id = r.block_id AND b.code = s.code AND t.code = b.topic
  AND i.topic_id = t.id;

-- A list left empty goes, and the levels' lists move up (positions 1, 2, 3… again).
CREATE TEMPORARY TABLE emptied AS
SELECT DISTINCT r.list_id AS id FROM replaced r
WHERE NOT EXISTS (SELECT 1 FROM topic_set_item i WHERE i.topic_set_id = r.list_id);

DELETE FROM sector_topic_set WHERE topic_set_id IN (SELECT id FROM emptied);
DELETE FROM establishment_type_topic_set WHERE topic_set_id IN (SELECT id FROM emptied);
DELETE FROM service_topic_set WHERE topic_set_id IN (SELECT id FROM emptied);
DELETE FROM topic_set WHERE id IN (SELECT id FROM emptied);

UPDATE sector_topic_set SET position = -position;
UPDATE sector_topic_set x SET position = r.rank
FROM (SELECT sector_id, topic_set_id, row_number() OVER (PARTITION BY sector_id ORDER BY position DESC) AS rank
      FROM sector_topic_set) r
WHERE x.sector_id = r.sector_id AND x.topic_set_id = r.topic_set_id;

UPDATE establishment_type_topic_set SET position = -position;
UPDATE establishment_type_topic_set x SET position = r.rank
FROM (SELECT type_id, topic_set_id, row_number() OVER (PARTITION BY type_id ORDER BY position DESC) AS rank
      FROM establishment_type_topic_set) r
WHERE x.type_id = r.type_id AND x.topic_set_id = r.topic_set_id;

UPDATE service_topic_set SET position = -position;
UPDATE service_topic_set x SET position = r.rank
FROM (SELECT service_id, topic_set_id, row_number() OVER (PARTITION BY service_id ORDER BY position DESC) AS rank
      FROM service_topic_set) r
WHERE x.service_id = r.service_id AND x.topic_set_id = r.topic_set_id;

DROP TABLE block, replaced, emptied;
