-- 0048: « Autre démarche » at Sen'Eau, the ONAS and Senelec (decided by
-- Olivia, 2026-10-09). A feedback with no service showed only « Autre » at
-- screen 2b: the sectors' lists were empty. The Water and Electricity sectors
-- now get the agency's blocks: Personnel, Guichet, Locaux and Frais (0046).
-- Their services keep their own lists only, as the mobile money services do
-- (replaces_shared_lists, 0026): nothing changes for them.

UPDATE service SET replaces_shared_lists = true
WHERE code IN ('WATER_SUPPLY', 'SEWER_ISSUE', 'WATER_AGENCY', 'ELECTRICITY_SUPPLY', 'ELECTRICITY_AGENCY');

-- The empty lists go.
DELETE FROM sector_topic_set
WHERE topic_set_id IN (SELECT id FROM topic_set WHERE code IN ('WATER', 'ELECTRICITY'));
DELETE FROM topic_set WHERE code IN ('WATER', 'ELECTRICITY');

INSERT INTO sector_topic_set (sector_id, topic_set_id, position)
SELECT s.id, ts.id, v.position
FROM sector s,
     (VALUES ('STAFF_SKILLS', 1), ('COUNTER', 2), ('PREMISES', 3), ('FEES', 4)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE s.code IN ('WATER', 'ELECTRICITY');
