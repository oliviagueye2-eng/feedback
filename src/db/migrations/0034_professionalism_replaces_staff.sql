-- 0034: « Compétence du personnel » (decided by Olivia, 2026-10-08).
-- Renamed « Compétence du personnel (Politesse, respect et professionnalisme) ».
-- It leaves the COMMON list and takes the place of « Politesse du personnel »
-- (STAFF) in the lists FILE_SERVICES, HEALTH, BANKING_INSURANCE, COMMERCE and
-- REAL_ESTATE: one topic about the staff there, not two. Elsewhere, STAFF and
-- PROFESSIONALISM stay as they are. Past answers keep their topic.

UPDATE topic_translation
SET label = 'Compétence du personnel (Politesse, respect et professionnalisme)'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM');

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'COMMON')
  AND topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM');

UPDATE topic_set_item
SET topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM')
WHERE topic_set_id IN (
    SELECT id FROM topic_set
    WHERE code IN ('FILE_SERVICES', 'HEALTH', 'BANKING_INSURANCE', 'COMMERCE', 'REAL_ESTATE')
  )
  AND topic_id = (SELECT id FROM topic WHERE code = 'STAFF');
