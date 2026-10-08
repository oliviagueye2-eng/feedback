-- 0035: « Comportement du chauffeur » (decided by Olivia, 2026-10-08).
-- « Politesse du personnel » (STAFF) leaves the TRANSPORT list. A new topic,
-- « Comportement du chauffeur (Politesse, respect et professionnalisme) », is
-- rated on a bus trip, a VTC ride and a taxi ride: their own list ROAD_TRIP,
-- the TRIP list plus this topic (the boat, the plane and the train keep TRIP).
-- In the staff category, after the staff's topics. Past answers keep their topic.

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT')
  AND topic_id = (SELECT id FROM topic WHERE code = 'STAFF');

INSERT INTO topic (code, position, category_id)
SELECT 'DRIVER_BEHAVIOUR', 8, id FROM evaluation_category WHERE code = 'STAFF';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Comportement du chauffeur (Politesse, respect et professionnalisme)'
FROM topic WHERE code = 'DRIVER_BEHAVIOUR';

INSERT INTO topic_set (code) VALUES ('ROAD_TRIP');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT (SELECT id FROM topic_set WHERE code = 'ROAD_TRIP'), topic_id
FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRIP');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'ROAD_TRIP' AND t.code = 'DRIVER_BEHAVIOUR';

UPDATE service
SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'ROAD_TRIP')
WHERE code IN ('LAND_TRIP', 'APP_RIDE', 'STREET_TAXI_RIDE');
