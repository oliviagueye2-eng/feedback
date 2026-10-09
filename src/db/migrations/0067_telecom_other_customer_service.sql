-- 0067: « Service client et réclamations » back in the telecom's « Autre
-- démarche » (decided by Olivia, 2026-10-09): it left with the TELECOM list in
-- 0065. A list of its own, after the shop's blocks.

INSERT INTO topic_set (code) VALUES ('CUSTOMER_SERVICE');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'CUSTOMER_SERVICE' AND t.code = 'CUSTOMER_SERVICE';

INSERT INTO sector_topic_set (sector_id, topic_set_id, position, only_without_service)
SELECT s.id, ts.id, (SELECT max(position) + 1 FROM sector_topic_set m WHERE m.sector_id = s.id), true
FROM sector s, topic_set ts WHERE s.code = 'TELECOM' AND ts.code = 'CUSTOMER_SERVICE';
