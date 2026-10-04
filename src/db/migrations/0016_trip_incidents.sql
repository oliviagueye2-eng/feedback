-- Incidents during a trip, and the train apart from the bus (validated on
-- 2026-10-04, /mnt/project-files/questionnaire/incidents-trajet.md).
--
-- 1. « Un trajet en bus ou en train » becomes two services, one per mode like
--    the boat and the plane: the bus (Dem Dikk, BRT, AFTU) keeps LAND_TRIP,
--    the TER gets TRAIN_TRIP. Same questions, except the incidents: nobody on
--    a train can judge how it is driven. Old feedbacks keep their service.
-- 2. Bus, train and boat ask whether an incident happened; after « Oui »,
--    which one, whether it was explained, and whether a solution was offered.
--    The type of incident differs per mode, so each mode has its question.

-- ---------------------------------------------------------------------------
-- The train
-- ---------------------------------------------------------------------------
UPDATE service SET synonyms = '{trajet,voyage,bus,car}' WHERE code = 'LAND_TRIP';
UPDATE service_translation SET label = 'Un trajet en bus'
WHERE language = 'fr' AND service_id = (SELECT id FROM service WHERE code = 'LAND_TRIP');

INSERT INTO question_set (code) VALUES ('TRAIN_TRIP');

INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT 'TRAIN_TRIP', s.id, ts.id, qs.id, '{trajet,voyage,train}'
FROM sector s, topic_set ts, question_set qs
WHERE s.code = 'TRANSPORT' AND ts.code = 'TRIP' AND qs.code = 'TRAIN_TRIP';

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Un trajet en train' FROM service WHERE code = 'TRAIN_TRIP';

DELETE FROM establishment_service es
USING establishment e, organization o, service s
WHERE e.id = es.establishment_id AND o.id = e.organization_id AND s.id = es.service_id
  AND o.code = 'TER' AND s.code = 'LAND_TRIP';

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN organization o ON o.id = e.organization_id AND o.code = 'TER'
JOIN service s ON s.code = 'TRAIN_TRIP';

-- ---------------------------------------------------------------------------
-- The incident questions
-- ---------------------------------------------------------------------------
-- Like the plane's delay questions, the explanation and the solution go with
-- the information; the incident and its kind say what happened, no category.
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES
  ('TRIP_INCIDENT', NULL),
  ('CROSSING_INCIDENT', NULL),
  ('BUS_INCIDENT_TYPE', NULL),
  ('TRAIN_INCIDENT_TYPE', NULL),
  ('BOAT_INCIDENT_TYPE', NULL),
  ('INCIDENT_EXPLAINED', 'PROCEDURE'),
  ('INCIDENT_SOLUTION', 'PROCEDURE')
) AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('TRIP_INCIDENT', 'Avez-vous eu un incident ou une panne pendant votre trajet ?'),
  ('CROSSING_INCIDENT', 'Avez-vous eu un incident ou une panne pendant votre traversée ?'),
  ('BUS_INCIDENT_TYPE', 'Quel a été l''incident principal ?'),
  ('TRAIN_INCIDENT_TYPE', 'Quel a été l''incident principal ?'),
  ('BOAT_INCIDENT_TYPE', 'Quel a été l''incident principal ?'),
  ('INCIDENT_EXPLAINED', 'Vous a-t-on expliqué ce qui se passait ?'),
  ('INCIDENT_SOLUTION', 'Vous a-t-on proposé une solution (autre véhicule, remboursement, reprise rapide du trajet) ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- No value for « Oui » / « Non » nor for the kinds of incident: none is better
-- than another.
INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('TRIP_INCIDENT', 'YES', NULL, 1),
  ('TRIP_INCIDENT', 'NO', NULL, 2),
  ('CROSSING_INCIDENT', 'YES', NULL, 1),
  ('CROSSING_INCIDENT', 'NO', NULL, 2),
  ('BUS_INCIDENT_TYPE', 'BREAKDOWN', NULL, 1),
  ('BUS_INCIDENT_TYPE', 'ACCIDENT', NULL, 2),
  ('BUS_INCIDENT_TYPE', 'DANGEROUS_DRIVING', NULL, 3),
  ('BUS_INCIDENT_TYPE', 'SECURITY', NULL, 4),
  ('BUS_INCIDENT_TYPE', 'EQUIPMENT', NULL, 5),
  ('BUS_INCIDENT_TYPE', 'OTHER', NULL, 6),
  ('TRAIN_INCIDENT_TYPE', 'BREAKDOWN', NULL, 1),
  ('TRAIN_INCIDENT_TYPE', 'ACCIDENT', NULL, 2),
  ('TRAIN_INCIDENT_TYPE', 'SECURITY', NULL, 3),
  ('TRAIN_INCIDENT_TYPE', 'EQUIPMENT', NULL, 4),
  ('TRAIN_INCIDENT_TYPE', 'OTHER', NULL, 5),
  ('BOAT_INCIDENT_TYPE', 'BREAKDOWN', NULL, 1),
  ('BOAT_INCIDENT_TYPE', 'ACCIDENT', NULL, 2),
  ('BOAT_INCIDENT_TYPE', 'OVERLOADED', NULL, 3),
  ('BOAT_INCIDENT_TYPE', 'SECURITY', NULL, 4),
  ('BOAT_INCIDENT_TYPE', 'EQUIPMENT', NULL, 5),
  ('BOAT_INCIDENT_TYPE', 'OTHER', NULL, 6),
  ('INCIDENT_EXPLAINED', 'YES_QUICKLY', 3, 1),
  ('INCIDENT_EXPLAINED', 'YES_LATE', 2, 2),
  ('INCIDENT_EXPLAINED', 'NO', 1, 3),
  ('INCIDENT_SOLUTION', 'YES', 3, 1),
  ('INCIDENT_SOLUTION', 'PARTLY', 2, 2),
  ('INCIDENT_SOLUTION', 'NO', 1, 3),
  ('INCIDENT_SOLUTION', 'NOT_NEEDED', NULL, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM (VALUES
  ('TRIP_INCIDENT', 'YES', 'Oui'),
  ('TRIP_INCIDENT', 'NO', 'Non'),
  ('CROSSING_INCIDENT', 'YES', 'Oui'),
  ('CROSSING_INCIDENT', 'NO', 'Non'),
  ('BUS_INCIDENT_TYPE', 'BREAKDOWN', 'Panne du véhicule / problème technique'),
  ('BUS_INCIDENT_TYPE', 'ACCIDENT', 'Accident ou accrochage'),
  ('BUS_INCIDENT_TYPE', 'DANGEROUS_DRIVING', 'Conduite dangereuse du chauffeur'),
  ('BUS_INCIDENT_TYPE', 'SECURITY', 'Problème de sécurité'),
  ('BUS_INCIDENT_TYPE', 'EQUIPMENT', 'Équipement en panne (portes, climatisation…)'),
  ('BUS_INCIDENT_TYPE', 'OTHER', 'Autre'),
  ('TRAIN_INCIDENT_TYPE', 'BREAKDOWN', 'Panne du train / problème technique'),
  ('TRAIN_INCIDENT_TYPE', 'ACCIDENT', 'Accident ou collision'),
  ('TRAIN_INCIDENT_TYPE', 'SECURITY', 'Problème de sécurité'),
  ('TRAIN_INCIDENT_TYPE', 'EQUIPMENT', 'Équipement en panne (portes, climatisation…)'),
  ('TRAIN_INCIDENT_TYPE', 'OTHER', 'Autre'),
  ('BOAT_INCIDENT_TYPE', 'BREAKDOWN', 'Panne du bateau / problème technique'),
  ('BOAT_INCIDENT_TYPE', 'ACCIDENT', 'Accident ou collision'),
  ('BOAT_INCIDENT_TYPE', 'OVERLOADED', 'Bateau surchargé'),
  ('BOAT_INCIDENT_TYPE', 'SECURITY', 'Problème de sécurité'),
  ('BOAT_INCIDENT_TYPE', 'EQUIPMENT', 'Équipement en panne ou manquant (gilets de sauvetage…)'),
  ('BOAT_INCIDENT_TYPE', 'OTHER', 'Autre'),
  ('INCIDENT_EXPLAINED', 'YES_QUICKLY', 'Oui, rapidement'),
  ('INCIDENT_EXPLAINED', 'YES_LATE', 'Oui, mais tard'),
  ('INCIDENT_EXPLAINED', 'NO', 'Non'),
  ('INCIDENT_SOLUTION', 'YES', 'Oui'),
  ('INCIDENT_SOLUTION', 'PARTLY', 'En partie'),
  ('INCIDENT_SOLUTION', 'NO', 'Non'),
  ('INCIDENT_SOLUTION', 'NOT_NEEDED', 'Ce n''était pas nécessaire')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

-- ---------------------------------------------------------------------------
-- The lists: the incident questions come last
-- ---------------------------------------------------------------------------
INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('LAND_TRIP', 'TRIP_INCIDENT', 4),
  ('LAND_TRIP', 'BUS_INCIDENT_TYPE', 5),
  ('LAND_TRIP', 'INCIDENT_EXPLAINED', 6),
  ('LAND_TRIP', 'INCIDENT_SOLUTION', 7),
  ('TRAIN_TRIP', 'STOP_WAIT', 1),
  ('TRAIN_TRIP', 'CROWDED', 2),
  ('TRAIN_TRIP', 'TICKET_GIVEN', 3),
  ('TRAIN_TRIP', 'TRIP_INCIDENT', 4),
  ('TRAIN_TRIP', 'TRAIN_INCIDENT_TYPE', 5),
  ('TRAIN_TRIP', 'INCIDENT_EXPLAINED', 6),
  ('TRAIN_TRIP', 'INCIDENT_SOLUTION', 7),
  ('BOAT_CROSSING', 'CROSSING_INCIDENT', 5),
  ('BOAT_CROSSING', 'BOAT_INCIDENT_TYPE', 6),
  ('BOAT_CROSSING', 'INCIDENT_EXPLAINED', 7),
  ('BOAT_CROSSING', 'INCIDENT_SOLUTION', 8)
) AS v (question_set, question, position)
JOIN question_set qs ON qs.code = v.question_set
JOIN question q ON q.code = v.question;

-- The three questions after the first one only after « Oui ».
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('LAND_TRIP', 'BUS_INCIDENT_TYPE', 'TRIP_INCIDENT'),
  ('LAND_TRIP', 'INCIDENT_EXPLAINED', 'TRIP_INCIDENT'),
  ('LAND_TRIP', 'INCIDENT_SOLUTION', 'TRIP_INCIDENT'),
  ('TRAIN_TRIP', 'TRAIN_INCIDENT_TYPE', 'TRIP_INCIDENT'),
  ('TRAIN_TRIP', 'INCIDENT_EXPLAINED', 'TRIP_INCIDENT'),
  ('TRAIN_TRIP', 'INCIDENT_SOLUTION', 'TRIP_INCIDENT'),
  ('BOAT_CROSSING', 'BOAT_INCIDENT_TYPE', 'CROSSING_INCIDENT'),
  ('BOAT_CROSSING', 'INCIDENT_EXPLAINED', 'CROSSING_INCIDENT'),
  ('BOAT_CROSSING', 'INCIDENT_SOLUTION', 'CROSSING_INCIDENT')
) AS v (question_set, question, depends_on)
JOIN question_set qs ON qs.code = v.question_set
JOIN question q ON q.code = v.question
JOIN question dq ON dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = 'YES';
