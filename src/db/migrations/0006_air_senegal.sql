-- The first airline, Air Sénégal (2026-10-02), rated like the other transport
-- operators: an organisation with its establishment « in general », and the
-- services the user chooses on screen 1. Its agencies and check-in counters
-- (sites with a QR code) will come later.

INSERT INTO organization (code, name, full_name, sector_id)
SELECT 'AIR_SENEGAL', 'Air Sénégal', 'Air Sénégal, compagnie aérienne nationale', id
FROM sector WHERE code = 'TRANSPORT';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, '{Air Senegal,compagnie aérienne nationale,avion,vol}', o.id, 'general', o.sector_id
FROM organization o WHERE o.code = 'AIR_SENEGAL';

-- Services: a flight, and buying or changing a ticket (a plane ticket is not
-- « un ticket ou une carte d'abonnement »: its own service, the same questions).
INSERT INTO service (code, sector_id, synonyms)
SELECT v.code, s.id, v.synonyms::text[]
FROM (VALUES
  ('FLIGHT', '{vol,avion,voyage,retard,bagages}'),
  ('PLANE_TICKET', '{billet,billet d''avion,réservation,modification,changement de date}')
) AS v (code, synonyms)
JOIN sector s ON s.code = 'TRANSPORT';

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('FLIGHT', 'Un vol'),
  ('PLANE_TICKET', 'Achat ou modification d''un billet')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN organization o ON o.id = e.organization_id AND o.code = 'AIR_SENEGAL'
JOIN service s ON s.code IN ('FLIGHT', 'PLANE_TICKET');

-- The departure question becomes common to the boat and the plane, so that
-- they compare (same answers).
UPDATE question_translation
SET label = 'Êtes-vous parti(e) à l''heure prévue ?'
WHERE language = 'fr'
  AND question_id = (SELECT id FROM question WHERE code = 'DEPARTURE_ON_TIME');

INSERT INTO question (code, type) VALUES
  ('DELAY_INFORMED', 'single_choice'),
  ('LUGGAGE', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('DELAY_INFORMED', 'Avez-vous été informé(e) du retard ou de l''annulation ?'),
  ('LUGGAGE', 'Avez-vous récupéré vos bagages complets et en bon état ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('DELAY_INFORMED', 'YES_IN_TIME', 3, 1),
  ('DELAY_INFORMED', 'YES_LATE', 2, 2),
  ('DELAY_INFORMED', 'NO', 1, 3),
  ('LUGGAGE', 'YES', 3, 1),
  ('LUGGAGE', 'PARTLY', 2, 2),
  ('LUGGAGE', 'NO', 1, 3),
  ('LUGGAGE', 'NO_CHECKED_LUGGAGE', NULL, 4)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM (VALUES
  ('DELAY_INFORMED', 'YES_IN_TIME', 'Oui, à temps'),
  ('DELAY_INFORMED', 'YES_LATE', 'Oui, mais tard'),
  ('DELAY_INFORMED', 'NO', 'Non'),
  ('LUGGAGE', 'YES', 'Oui'),
  ('LUGGAGE', 'PARTLY', 'En partie'),
  ('LUGGAGE', 'NO', 'Non'),
  ('LUGGAGE', 'NO_CHECKED_LUGGAGE', 'Pas de bagage en soute')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

INSERT INTO question_set (code) VALUES ('FLIGHT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('DEPARTURE_ON_TIME', 1),
  ('DELAY_INFORMED', 2),
  ('BOARDING', 3),
  ('LUGGAGE', 4)
) AS v (question, position)
JOIN question_set qs ON qs.code = 'FLIGHT'
JOIN question q ON q.code = v.question;

-- « Informé(e) ? » only after a delay or a cancellation.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM question_set qs, question q, question dq
JOIN answer_option ao ON ao.question_id = dq.id
WHERE qs.code = 'FLIGHT' AND q.code = 'DELAY_INFORMED' AND dq.code = 'DEPARTURE_ON_TIME'
  AND ao.code IN ('UNDER_1_H_LATE', 'OVER_1_H_LATE', 'CANCELLED');

UPDATE service s
SET question_set_id = qs.id
FROM (VALUES
  ('FLIGHT', 'FLIGHT'),
  ('PLANE_TICKET', 'TICKET_PURCHASE')
) AS v (service, question_set)
JOIN question_set qs ON qs.code = v.question_set
WHERE s.code = v.service;
