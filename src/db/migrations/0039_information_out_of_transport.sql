-- 0039: « Explications du personnel » (INFORMATION) leaves the TRANSPORT list
-- (decided by Olivia, 2026-10-08): on a bus, a VTC or a taxi ride the driver
-- explains no procedure. It goes back to the lists of the other transport
-- services: TRIP (boat, plane, train), TRANSPORT_PLACE (buying a ticket, the
-- airport, the bus stations) and TOLL_HIGHWAY. The port's procedures have it
-- through FILE_SERVICES. « Autre démarche » on a transport operator, which only
-- has the TRANSPORT list, no longer offers it either.

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT')
  AND topic_id = (SELECT id FROM topic WHERE code = 'INFORMATION');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code IN ('TRIP', 'TRANSPORT_PLACE', 'TOLL_HIGHWAY') AND t.code = 'INFORMATION';
