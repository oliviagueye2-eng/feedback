-- Transport operators and their services (validated 2026-10-02).
-- - Organisations, each with its establishment « in general »: Dem Dikk
--   (Dakar Dem Dikk renamed Dem Dikk S.A. on 2026-09-11), BRT (Dakar Mobilité),
--   TER (SETER), AFTU (minibus Tata), COSAMA (maritime). Their lines and
--   stations will be their sites, from the lists they publish.
-- - COSAMA's site: the ship Aline Sitoë Diatta (Dakar – Ziguinchor).
-- - Services = what the user came to do (never the fact of complaining): a trip
--   by bus or train, a boat crossing, buying a ticket or a pass. Each has its
--   questions; the trip by bus or train keeps the Transport questions (0017).
-- - Type « Compagnie maritime » (questions of the crossing) for COSAMA, so that
--   no service chosen (or « Autre démarche ») does not give the bus questions.
-- Generated from one description, like 0017.


INSERT INTO organization (code, name, full_name, sector_id) VALUES
  ('DEM_DIKK', 'Dem Dikk', 'Dem Dikk S.A. (anciennement Dakar Dem Dikk)', (SELECT id FROM sector WHERE code = 'TRANSPORT')),
  ('BRT', 'BRT', 'Bus Rapid Transit de Dakar, exploité par Dakar Mobilité', (SELECT id FROM sector WHERE code = 'TRANSPORT')),
  ('TER', 'TER', 'Train express régional de Dakar, exploité par la SETER', (SELECT id FROM sector WHERE code = 'TRANSPORT')),
  ('AFTU', 'AFTU', 'Association de financement des professionnels du transport urbain', (SELECT id FROM sector WHERE code = 'TRANSPORT')),
  ('COSAMA', 'COSAMA', 'Consortium sénégalais d''activités maritimes', (SELECT id FROM sector WHERE code = 'TRANSPORT'));

-- Questions of the crossing and of the ticket purchase.

INSERT INTO questionnaire (code, version, status, published_at) VALUES
  ('BOAT_CROSSING', 1, 'published', now()),
  ('TICKET_PURCHASE', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1), 'DEPARTURE_ON_TIME', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1), 'BOARDING', 'yes_partial_no', 2),
  ((SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1), 'SEAT_AS_BOOKED', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1), 'SAFETY_BRIEFING', 'single_choice', 4);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME'), 'fr', 'Le bateau est-il parti à l''heure prévue ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING'), 'fr', 'L''embarquement s''est-il bien passé ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SEAT_AS_BOOKED'), 'fr', 'Aviez-vous une place correspondant à votre billet (siège, couchette, cabine) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING'), 'fr', 'Les consignes de sécurité (gilets, exercices) ont-elles été présentées ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME'), 'ON_TIME', 4, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME'), 'UNDER_1_H_LATE', 3, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME'), 'OVER_1_H_LATE', 2, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME'), 'CANCELLED', 1, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SEAT_AS_BOOKED'), 'YES', 2, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SEAT_AS_BOOKED'), 'NO', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING'), 'YES', 2, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING'), 'NO', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING'), 'DONT_KNOW', NULL, 3);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME') AND code = 'ON_TIME'), 'fr', 'À l''heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME') AND code = 'UNDER_1_H_LATE'), 'fr', 'Moins d''1 heure de retard'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME') AND code = 'OVER_1_H_LATE'), 'fr', 'Plus d''1 heure de retard'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'DEPARTURE_ON_TIME') AND code = 'CANCELLED'), 'fr', 'Départ annulé ou reporté'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'BOARDING') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SEAT_AS_BOOKED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SEAT_AS_BOOKED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1) AND code = 'SAFETY_BRIEFING') AND code = 'DONT_KNOW'), 'fr', 'Je ne sais pas');

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1), 'GOAL_ACHIEVED', 'yes_partial_no', 1),
  ((SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1), 'WAIT_TIME', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1), 'PAYMENT_AS_WISHED', 'single_choice', 3);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'fr', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), 'fr', 'Combien de temps avez-vous attendu avant d''être servi(e) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'PAYMENT_AS_WISHED'), 'fr', 'Avez-vous pu payer comme vous le souhaitiez (espèces, paiement mobile…) ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), 'UNDER_30_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), '30_MIN_TO_1_H', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), '1_TO_2_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), '2_TO_4_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME'), 'OVER_4_H', 5, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'PAYMENT_AS_WISHED'), 'YES', 2, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'PAYMENT_AS_WISHED'), 'NO', 1, 2);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'UNDER_30_MIN'), 'fr', 'Moins de 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME') AND code = '1_TO_2_H'), 'fr', '1 à 2 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME') AND code = '2_TO_4_H'), 'fr', '2 à 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'OVER_4_H'), 'fr', 'Plus de 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'PAYMENT_AS_WISHED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1) AND code = 'PAYMENT_AS_WISHED') AND code = 'NO'), 'fr', 'Non');

INSERT INTO establishment_type (code, sector_id, detailed_questionnaire_id)
SELECT 'MARITIME_OPERATOR', s.id, (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1)
FROM sector s WHERE s.code = 'TRANSPORT';

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT id, 'fr', 'Compagnie maritime' FROM establishment_type WHERE code = 'MARITIME_OPERATOR';

-- Establishments « in general », then COSAMA's ship (private operator with a public service mission).

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id, type_id, ownership) VALUES
  ('Dem Dikk', '{"Dakar Dem Dikk","DDD","Dem Dikk S.A."}', (SELECT id FROM organization WHERE code = 'DEM_DIKK'), 'general', (SELECT id FROM sector WHERE code = 'TRANSPORT'), NULL, NULL),
  ('BRT', '{"Dakar Mobilité","Sunu BRT","Bus Rapid Transit"}', (SELECT id FROM organization WHERE code = 'BRT'), 'general', (SELECT id FROM sector WHERE code = 'TRANSPORT'), NULL, NULL),
  ('TER', '{"SETER","SENTER","Train express régional"}', (SELECT id FROM organization WHERE code = 'TER'), 'general', (SELECT id FROM sector WHERE code = 'TRANSPORT'), NULL, NULL),
  ('AFTU', '{"Tata","minibus Tata","bus Tata"}', (SELECT id FROM organization WHERE code = 'AFTU'), 'general', (SELECT id FROM sector WHERE code = 'TRANSPORT'), NULL, NULL),
  ('COSAMA', '{"Consortium sénégalais d''activités maritimes","bateau","ferry","liaison maritime"}', (SELECT id FROM organization WHERE code = 'COSAMA'), 'general', (SELECT id FROM sector WHERE code = 'TRANSPORT'), (SELECT id FROM establishment_type WHERE code = 'MARITIME_OPERATOR'), NULL),
  ('Aline Sitoë Diatta (bateau Dakar – Ziguinchor)', '{"bateau Dakar Ziguinchor","Aline Sitoe Diatta","ferry Ziguinchor"}', (SELECT id FROM organization WHERE code = 'COSAMA'), 'site', (SELECT id FROM sector WHERE code = 'TRANSPORT'), (SELECT id FROM establishment_type WHERE code = 'MARITIME_OPERATOR'), 'private');

-- Services, their French labels (search_text follows by trigger) and questions.

INSERT INTO service (code, sector_id, synonyms, detailed_questionnaire_id) VALUES
  ('LAND_TRIP', (SELECT id FROM sector WHERE code = 'TRANSPORT'), '{"trajet","voyage","bus","train"}', (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1)),
  ('BOAT_CROSSING', (SELECT id FROM sector WHERE code = 'TRANSPORT'), '{"traversée","bateau","ferry","voyage"}', (SELECT id FROM questionnaire WHERE code = 'BOAT_CROSSING' AND version = 1)),
  ('TICKET_PURCHASE', (SELECT id FROM sector WHERE code = 'TRANSPORT'), '{"ticket","billet","abonnement","carte"}', (SELECT id FROM questionnaire WHERE code = 'TICKET_PURCHASE' AND version = 1));

INSERT INTO service_translation (service_id, language, label) VALUES
  ((SELECT id FROM service WHERE code = 'LAND_TRIP'), 'fr', 'Un trajet en bus ou en train'),
  ((SELECT id FROM service WHERE code = 'BOAT_CROSSING'), 'fr', 'Une traversée en bateau'),
  ((SELECT id FROM service WHERE code = 'TICKET_PURCHASE'), 'fr', 'Achat d''un ticket ou d''une carte d''abonnement');

-- Which establishments offer which service: the operators' establishments (« in general » and sites).

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM (VALUES
  ('LAND_TRIP', 'DEM_DIKK'),
  ('LAND_TRIP', 'BRT'),
  ('LAND_TRIP', 'TER'),
  ('LAND_TRIP', 'AFTU'),
  ('BOAT_CROSSING', 'COSAMA'),
  ('TICKET_PURCHASE', 'DEM_DIKK'),
  ('TICKET_PURCHASE', 'BRT'),
  ('TICKET_PURCHASE', 'TER'),
  ('TICKET_PURCHASE', 'AFTU'),
  ('TICKET_PURCHASE', 'COSAMA')
) AS v (service, organization)
JOIN service s ON s.code = v.service
JOIN organization o ON o.code = v.organization
JOIN establishment e ON e.organization_id = o.id;
