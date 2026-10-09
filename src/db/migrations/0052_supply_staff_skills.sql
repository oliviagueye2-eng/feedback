-- 0052: « Personnel » for the technicians who come on site (decided by Olivia,
-- 2026-10-09): « L'eau chez vous », « Le courant chez vous » and the ONAS's
-- sewer or flooding problem get the STAFF_SKILLS block (0046).

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, (SELECT max(position) FROM service_topic_set m WHERE m.service_id = s.id) + 1
FROM service s, topic_set ts
WHERE s.code IN ('WATER_SUPPLY', 'ELECTRICITY_SUPPLY', 'SEWER_ISSUE') AND ts.code = 'STAFF_SKILLS';
