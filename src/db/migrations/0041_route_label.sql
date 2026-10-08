-- 0041: ROUTE renamed « Respect de l'itinéraire et durée du trajet » (decided
-- by Olivia, 2026-10-08): a fact the user can judge, and « trajet » fits the
-- bus as well as the VTC and the taxi.

UPDATE topic_translation
SET label = 'Respect de l''itinéraire et durée du trajet'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'ROUTE');
