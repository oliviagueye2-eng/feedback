-- 0063: « Qualité du courant (pas de baisses de tension) » for « Le courant chez
-- vous » (decided by Olivia, 2026-10-09), the counterpart of the water's quality.
-- It comes right after the power cuts.

UPDATE topic SET position = position + 1 WHERE position > 51;

INSERT INTO topic (code, position, category_id)
SELECT 'POWER_QUALITY', 52, id FROM evaluation_category WHERE code = 'SERVICE_QUALITY';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Qualité du courant (pas de baisses de tension)' FROM topic WHERE code = 'POWER_QUALITY';

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'ELECTRICITY_SUPPLY' AND t.code = 'POWER_QUALITY';
