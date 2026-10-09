-- 0060: no « Service client et réclamations » for the street taxis (decided by
-- Olivia, 2026-10-09): the yellow and black taxis have no customer service.
-- The topic came from the sector's list TRANSPORT, which holds only it. The list
-- now goes to the feedbacks without a service (« Autre démarche », the airport)
-- and, by name, to every transport service but the taxi.
UPDATE sector_topic_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'TRANSPORT')
  AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT');

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, (SELECT coalesce(max(position), 0) + 1 FROM service_topic_set m WHERE m.service_id = s.id)
FROM service s, topic_set ts
WHERE ts.code = 'TRANSPORT'
  AND s.code IN ('TICKET_PURCHASE', 'PLANE_TICKET', 'HIGHWAY_TRIP', 'LAND_TRIP', 'TRAIN_TRIP', 'FLIGHT',
                 'APP_RIDE', 'PORT_PROCEDURE', 'BOAT_CROSSING');
