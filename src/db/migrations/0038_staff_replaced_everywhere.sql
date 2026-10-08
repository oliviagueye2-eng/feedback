-- 0038: « Politesse du personnel » (STAFF) is no longer offered (decided by
-- Olivia, 2026-10-08): « Compétence du personnel (Politesse, respect et
-- professionnalisme) » takes its place in every list still holding it. Where
-- a list already holds both (mobile money), STAFF only leaves. Past answers
-- keep their topic.

DELETE FROM topic_set_item i
WHERE i.topic_id = (SELECT id FROM topic WHERE code = 'STAFF')
  AND EXISTS (
    SELECT 1 FROM topic_set_item p
    WHERE p.topic_set_id = i.topic_set_id
      AND p.topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM')
  );

UPDATE topic_set_item
SET topic_id = (SELECT id FROM topic WHERE code = 'PROFESSIONALISM')
WHERE topic_id = (SELECT id FROM topic WHERE code = 'STAFF');
