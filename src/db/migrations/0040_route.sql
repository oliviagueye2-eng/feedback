-- 0040: « Pertinence de l'itinéraire et durée de la course » (decided by
-- Olivia, 2026-10-08): a detour or a ride that drags on, which neither
-- « Ponctualité » nor the VTC questions cover. In the ROAD_TRIP list (bus,
-- VTC, taxi), in the delays category after « Ponctualité ».

INSERT INTO topic (code, position, category_id)
SELECT 'ROUTE', 18, id FROM evaluation_category WHERE code = 'DELAYS';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Pertinence de l''itinéraire et durée de la course'
FROM topic WHERE code = 'ROUTE';

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'ROAD_TRIP' AND t.code = 'ROUTE';
