-- 0056: « Durée du contrôle », the time the check took (decided by Olivia,
-- 2026-10-09). In the list POLICE_FIELD of « Un contrôle », empty since 0013,
-- in the delays category after « Pertinence de l'itinéraire ».

INSERT INTO topic (code, position, category_id)
SELECT 'CHECK_DURATION', 19, id FROM evaluation_category WHERE code = 'DELAYS';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Durée du contrôle'
FROM topic WHERE code = 'CHECK_DURATION';

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'POLICE_FIELD' AND t.code = 'CHECK_DURATION';
