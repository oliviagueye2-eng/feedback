-- 0045: lists combined instead of copied (decided by Olivia, 2026-10-09).
-- A user sees the same topics and the same questions as before.
--   T1. The VTC ride: ROAD_TRIP, like the bus and the taxi, then APP_RIDE,
--       which keeps only « Prise en charge » (0043 had copied ROAD_TRIP).
--   Q1. PAYMENT: « Avez-vous pu payer comme vous le souhaitiez ? », copied in
--       TICKET_PURCHASE, APP_RIDE and STREET_TAXI_RIDE.
--   Q2. PAID_AND_RECEIPT: « Avez-vous payé quelque chose ? », then the receipt
--       when « Oui », copied in FILE_SERVICES, HEALTH, POLICE_FIELD and
--       POLICE_PREMISES (the bank and the shops ask another 2nd question).
--   Q3. The mobile money agent: MOBILE_MONEY, then MOBILE_MONEY_AGENT, which
--       keeps only the agent's cash.
--   Q4. STATION: the four questions shared by the bus stations and the
--       airport, which adds AIRPORT (the wait at the checks).
-- A shared list goes after the lists of the level that held its questions.

-- T1
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'APP_RIDE')
  AND topic_id <> (SELECT id FROM topic WHERE code = 'PICKUP');

UPDATE service_topic_set SET position = 2
WHERE service_id = (SELECT id FROM service WHERE code = 'APP_RIDE');

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, 1 FROM service s, topic_set ts
WHERE s.code = 'APP_RIDE' AND ts.code = 'ROAD_TRIP';

-- Q1 to Q4: the new lists and their questions.
INSERT INTO question_set (code) VALUES ('PAYMENT'), ('PAID_AND_RECEIPT'), ('STATION');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES ('PAYMENT', 'PAYMENT_AS_WISHED', 1),
             ('PAID_AND_RECEIPT', 'PAID_SOMETHING', 1),
             ('PAID_AND_RECEIPT', 'RECEIPT_GIVEN', 2),
             ('STATION', 'WAYFINDING', 1),
             ('STATION', 'SEAT_TO_WAIT', 2),
             ('STATION', 'TOILETS', 3),
             ('STATION', 'TRANSPORT_ACCESS', 4)) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- The receipt, asked when « Oui » to « Avez-vous payé quelque chose ? », as in the lists it leaves.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT DISTINCT (SELECT id FROM question_set WHERE code = 'PAID_AND_RECEIPT'),
       qc.question_id, qc.depends_on_question_id, qc.option_id
FROM question_condition qc
WHERE qc.question_set_id = (SELECT id FROM question_set WHERE code = 'FILE_SERVICES')
  AND qc.question_id = (SELECT id FROM question WHERE code = 'RECEIPT_GIVEN');

-- Every level using one of these lists also gets the shared one, after its own lists.
CREATE TEMPORARY TABLE shared (list text, shared text, before boolean);
INSERT INTO shared VALUES
  ('TICKET_PURCHASE', 'PAYMENT', false),
  ('APP_RIDE', 'PAYMENT', false),
  ('STREET_TAXI_RIDE', 'PAYMENT', false),
  ('FILE_SERVICES', 'PAID_AND_RECEIPT', false),
  ('HEALTH', 'PAID_AND_RECEIPT', false),
  ('POLICE_FIELD', 'PAID_AND_RECEIPT', false),
  ('POLICE_PREMISES', 'PAID_AND_RECEIPT', false),
  ('MOBILE_MONEY_AGENT', 'MOBILE_MONEY', true),
  ('AIRPORT', 'STATION', true);

INSERT INTO sector_question_set (sector_id, question_set_id, position)
SELECT DISTINCT x.sector_id, s.id,
       (SELECT max(position) + 1 FROM sector_question_set m WHERE m.sector_id = x.sector_id)
FROM sector_question_set x
JOIN question_set l ON l.id = x.question_set_id
JOIN shared ON shared.list = l.code AND NOT shared.before
JOIN question_set s ON s.code = shared.shared;

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT DISTINCT x.type_id, s.id,
       (SELECT max(position) + 1 FROM establishment_type_question_set m WHERE m.type_id = x.type_id)
FROM establishment_type_question_set x
JOIN question_set l ON l.id = x.question_set_id
JOIN shared ON shared.list = l.code AND NOT shared.before
JOIN question_set s ON s.code = shared.shared;

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT DISTINCT x.service_id, s.id,
       (SELECT max(position) + 1 FROM service_question_set m WHERE m.service_id = x.service_id)
FROM service_question_set x
JOIN question_set l ON l.id = x.question_set_id
JOIN shared ON shared.list = l.code AND NOT shared.before
JOIN question_set s ON s.code = shared.shared;

-- A list asked first (MOBILE_MONEY for the agent, STATION for the airport):
-- the level's lists move down one place, highest first (unique positions).
UPDATE establishment_type_question_set x SET position = -position
WHERE type_id IN (SELECT y.type_id FROM establishment_type_question_set y
                  JOIN question_set l ON l.id = y.question_set_id
                  JOIN shared ON shared.list = l.code AND shared.before);
UPDATE establishment_type_question_set SET position = 1 - position WHERE position < 0;
INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT DISTINCT x.type_id, s.id, 1
FROM establishment_type_question_set x
JOIN question_set l ON l.id = x.question_set_id
JOIN shared ON shared.list = l.code AND shared.before
JOIN question_set s ON s.code = shared.shared;

UPDATE service_question_set x SET position = -position
WHERE service_id IN (SELECT y.service_id FROM service_question_set y
                     JOIN question_set l ON l.id = y.question_set_id
                     JOIN shared ON shared.list = l.code AND shared.before);
UPDATE service_question_set SET position = 1 - position WHERE position < 0;
INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT DISTINCT x.service_id, s.id, 1
FROM service_question_set x
JOIN question_set l ON l.id = x.question_set_id
JOIN shared ON shared.list = l.code AND shared.before
JOIN question_set s ON s.code = shared.shared;

-- The bus stations: STATION instead of BUS_STATION, which holds nothing else.
UPDATE establishment_type_question_set
SET question_set_id = (SELECT id FROM question_set WHERE code = 'STATION')
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'BUS_STATION');

-- The questions leave the lists that copied them (their conditions go with them).
DELETE FROM question_set_item i
USING question_set l, question q
WHERE l.id = i.question_set_id AND q.id = i.question_id
  AND ((l.code IN ('TICKET_PURCHASE', 'APP_RIDE', 'STREET_TAXI_RIDE') AND q.code = 'PAYMENT_AS_WISHED')
    OR (l.code IN ('FILE_SERVICES', 'HEALTH', 'POLICE_FIELD', 'POLICE_PREMISES')
        AND q.code IN ('PAID_SOMETHING', 'RECEIPT_GIVEN'))
    OR (l.code = 'MOBILE_MONEY_AGENT' AND q.code IN ('MONEY_OPERATION_OK', 'MONEY_PROBLEM_SOLVED'))
    OR (l.code IN ('AIRPORT', 'BUS_STATION')
        AND q.code IN ('WAYFINDING', 'SEAT_TO_WAIT', 'TOILETS', 'TRANSPORT_ACCESS')));

DELETE FROM question_set WHERE code = 'BUS_STATION';

-- The lists that lost questions: positions 1, 2, 3… again.
UPDATE question_set_item i SET position = -i.position
FROM question_set l
WHERE l.id = i.question_set_id
  AND l.code IN ('TICKET_PURCHASE', 'APP_RIDE', 'STREET_TAXI_RIDE', 'FILE_SERVICES', 'HEALTH',
                 'POLICE_FIELD', 'POLICE_PREMISES', 'MOBILE_MONEY_AGENT', 'AIRPORT');
UPDATE question_set_item i SET position = r.rank
FROM (SELECT question_set_id, question_id,
             row_number() OVER (PARTITION BY question_set_id ORDER BY position DESC) AS rank
      FROM question_set_item WHERE position < 0) r
WHERE i.question_set_id = r.question_set_id AND i.question_id = r.question_id;

DROP TABLE shared;
