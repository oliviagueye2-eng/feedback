-- 0047: « Frais payés » (decided by Olivia, 2026-10-09).
-- 1. A clearer label: what is judged is the amount and the receipt.
-- 2. Where one always pays (a ride, a ticket, a trip, the highway), the topic
--    is shown straight away, without « Avez-vous payé quelque chose ? » first.
--    The condition stays the topic's (0011); a list item can lift it
--    (topic_set_item.shown_always), so the results stay on one topic. A form
--    shows a topic always when one of its lists holds it so.

UPDATE topic_translation SET label = 'Frais payés (montant justifié et conforme au tarif annoncé, reçu remis)'
WHERE language = 'fr' AND topic_id = (SELECT id FROM topic WHERE code = 'FEES');

ALTER TABLE topic_set_item ADD COLUMN shown_always boolean NOT NULL DEFAULT false;

-- The « Frais » block without its question.
INSERT INTO topic_set (code) VALUES ('FEES_SHOWN_ALWAYS');

INSERT INTO topic_set_item (topic_set_id, topic_id, shown_always)
SELECT s.id, t.id, true FROM topic_set s, topic t WHERE s.code = 'FEES_SHOWN_ALWAYS' AND t.code = 'FEES';

-- The taxi, the VTC, the ticket counters, the highway and the trips (car, train, plane, boat).
INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, coalesce((SELECT max(position) FROM service_topic_set m WHERE m.service_id = s.id), 0) + 1
FROM service s, topic_set ts
WHERE ts.code = 'FEES_SHOWN_ALWAYS'
  AND s.code IN ('STREET_TAXI_RIDE', 'APP_RIDE', 'TICKET_PURCHASE', 'PLANE_TICKET', 'HIGHWAY_TRIP',
                 'LAND_TRIP', 'TRAIN_TRIP', 'FLIGHT', 'BOAT_CROSSING');
