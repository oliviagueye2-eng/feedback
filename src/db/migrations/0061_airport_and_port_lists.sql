-- 0061 (decided by Olivia, 2026-10-09):
-- The airport loses the « Guichet » block (COUNTER: « Temps d'attente »,
-- « Horaires d'ouverture »): it is open around the clock, and its own question
-- asks the wait at the checks.
DELETE FROM establishment_type_topic_set
WHERE type_id = (SELECT id FROM establishment_type WHERE code = 'AIRPORT')
  AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'COUNTER');

-- « Une démarche au port » had the « Locaux » block (PREMISES) twice: from the
-- sector TRANSPORT and by name. The sector gives it already; nothing changes on screen.
DELETE FROM service_topic_set
WHERE service_id = (SELECT id FROM service WHERE code = 'PORT_PROCEDURE')
  AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'PREMISES');

-- The lists left move up (positions 1, 2, 3… again).
UPDATE establishment_type_topic_set x SET position = r.rank
FROM (SELECT type_id, topic_set_id, row_number() OVER (PARTITION BY type_id ORDER BY position) AS rank
      FROM establishment_type_topic_set WHERE type_id = (SELECT id FROM establishment_type WHERE code = 'AIRPORT')) r
WHERE x.type_id = r.type_id AND x.topic_set_id = r.topic_set_id;

UPDATE service_topic_set SET position = -position
WHERE service_id = (SELECT id FROM service WHERE code = 'PORT_PROCEDURE');
UPDATE service_topic_set x SET position = r.rank
FROM (SELECT service_id, topic_set_id, row_number() OVER (PARTITION BY service_id ORDER BY position DESC) AS rank
      FROM service_topic_set WHERE service_id = (SELECT id FROM service WHERE code = 'PORT_PROCEDURE')) r
WHERE x.service_id = r.service_id AND x.topic_set_id = r.topic_set_id;
