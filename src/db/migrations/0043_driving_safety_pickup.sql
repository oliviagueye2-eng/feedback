-- 0043: two topics for a road trip (decided by Olivia, 2026-10-09).
-- « Sécurité (conduite prudente et respect du code de la route) » replaces
-- « Sécurité à bord » in the ROAD_TRIP list (bus, taxi, VTC); the boat, the
-- plane and the train keep « Sécurité à bord » through TRIP. A topic has one
-- label wherever it is used, hence a new topic rather than a renaming.
-- « Prise en charge (facilité pour trouver et contacter le chauffeur) » is
-- rated on a VTC ride only: a taxi is hailed in the street, and its form
-- already asks how long finding one took. A service has one topic list, so
-- the VTC gets its own, APP_RIDE: the ROAD_TRIP list plus this topic.
-- Past answers keep their topic.

INSERT INTO topic (code, position, category_id)
SELECT 'DRIVING_SAFETY', 63, id FROM evaluation_category WHERE code = 'PREMISES';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Sécurité (conduite prudente et respect du code de la route)'
FROM topic WHERE code = 'DRIVING_SAFETY';

UPDATE topic_set_item
SET topic_id = (SELECT id FROM topic WHERE code = 'DRIVING_SAFETY')
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'ROAD_TRIP')
  AND topic_id = (SELECT id FROM topic WHERE code = 'ONBOARD_SAFETY');

INSERT INTO topic (code, position, category_id)
SELECT 'PICKUP', 27, id FROM evaluation_category WHERE code = 'PROCEDURE';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Prise en charge (facilité pour trouver et contacter le chauffeur)'
FROM topic WHERE code = 'PICKUP';

INSERT INTO topic_set (code) VALUES ('APP_RIDE');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT (SELECT id FROM topic_set WHERE code = 'APP_RIDE'), topic_id
FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'ROAD_TRIP');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'APP_RIDE' AND t.code = 'PICKUP';

UPDATE service
SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'APP_RIDE')
WHERE code = 'APP_RIDE';
