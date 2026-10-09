-- 0055: « Prise en compte de la demande » leaves « Un contrôle » (asked by
-- Olivia, 2026-10-09): during a check the user asked for nothing. The topic
-- leaves the list SECURITY and gets its own list, given to the visit at the
-- premises, the call for help, and the feedbacks without a service (« Autre
-- démarche »). The service lists come after the sector's: the topic moves
-- after « Respect des droits » there.
INSERT INTO topic_set (code) VALUES ('SECURITY_REQUEST');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t WHERE s.code = 'SECURITY_REQUEST' AND t.code = 'REQUEST_HANDLING';

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'SECURITY')
  AND topic_id = (SELECT id FROM topic WHERE code = 'REQUEST_HANDLING');

-- First of the service's lists (theirs move down one place).
UPDATE service_topic_set SET position = -position - 1
WHERE service_id IN (SELECT id FROM service WHERE code IN ('POLICE_PREMISES', 'POLICE_CALL'));
UPDATE service_topic_set SET position = -position
WHERE service_id IN (SELECT id FROM service WHERE code IN ('POLICE_PREMISES', 'POLICE_CALL'));

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT v.id, s.id, 1 FROM service v, topic_set s
WHERE v.code IN ('POLICE_PREMISES', 'POLICE_CALL') AND s.code = 'SECURITY_REQUEST';

INSERT INTO sector_topic_set (sector_id, topic_set_id, position, only_without_service)
SELECT se.id, s.id, (SELECT max(position) + 1 FROM sector_topic_set m WHERE m.sector_id = se.id), true
FROM sector se, topic_set s WHERE se.code = 'SECURITY' AND s.code = 'SECURITY_REQUEST';
