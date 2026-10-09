-- 0054: « Politesse du personnel (accueil, respect) » (STAFF, offered nowhere
-- since 0038) and « État des véhicules » (VEHICLE_CONDITION, in no list since
-- 0009) go (asked by Olivia, 2026-10-09). The answers given to them go too:
-- only tests so far (Olivia, same day). The published counts drop them at
-- their next refresh.

DELETE FROM feedback_topic
WHERE topic_id IN (SELECT id FROM topic WHERE code IN ('STAFF', 'VEHICLE_CONDITION'));

DELETE FROM topic WHERE code IN ('STAFF', 'VEHICLE_CONDITION');
