-- 0050: the questions of the administrations for the agencies of Sen'Eau,
-- Senelec and the ONAS, and for their « Autre démarche » (decided by Olivia,
-- 2026-10-09): FILE_SERVICES (what one came for, the visits, the wait, the
-- papers) and PAID_AND_RECEIPT (the payment, then the receipt). Added, not
-- copied; each agency keeps its « Votre démarche porte sur » first.

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, (SELECT max(position) FROM service_question_set m WHERE m.service_id = s.id) + v.position
FROM service s,
     (VALUES ('FILE_SERVICES', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE s.code IN ('WATER_AGENCY', 'ELECTRICITY_AGENCY', 'SANITATION_AGENCY');

-- The sectors' lists: « Autre démarche » only, their services replace them (0048).
INSERT INTO sector_question_set (sector_id, question_set_id, position)
SELECT s.id, qs.id, v.position
FROM sector s,
     (VALUES ('FILE_SERVICES', 1), ('PAID_AND_RECEIPT', 2)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE s.code IN ('WATER', 'ELECTRICITY');
