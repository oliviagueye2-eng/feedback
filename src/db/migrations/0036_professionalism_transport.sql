-- 0036: « Compétence du personnel (Politesse, respect et professionnalisme) »
-- for the boat, the plane, the train and the toll highway (decided by Olivia,
-- 2026-10-08): they lost « Politesse du personnel » with 0035. The bus, the
-- VTC and the taxi have « Comportement du chauffeur » instead; the port's
-- procedures have it through FILE_SERVICES (0034).

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code IN ('TRIP', 'TOLL_HIGHWAY') AND t.code = 'PROFESSIONALISM';
