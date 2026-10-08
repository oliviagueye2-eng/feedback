-- 0037: « Compétence du personnel » also in TRANSPORT_PLACE (decided by
-- Olivia, 2026-10-08): buying a ticket, the airport and the bus stations,
-- which share this list.

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'TRANSPORT_PLACE' AND t.code = 'PROFESSIONALISM';
