-- 0051: « Frais payés » straight away for a sewer or flooding problem at the
-- ONAS (decided by Olivia, 2026-10-09): emptying a septic tank is nearly
-- always paid. As for the rides (0047), the FEES_SHOWN_ALWAYS block.

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, (SELECT max(position) FROM service_topic_set m WHERE m.service_id = s.id) + 1
FROM service s, topic_set ts
WHERE s.code = 'SEWER_ISSUE' AND ts.code = 'FEES_SHOWN_ALWAYS';
