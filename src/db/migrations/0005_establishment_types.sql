-- Establishment types, validated on 2026-10-02: Health, Administration,
-- Education, Justice, Security, Tax, Social, Transport, then Retail, Culture,
-- Sport and Tourism. One type per
-- establishment: a school covering several levels is a « Groupe scolaire »; a
-- French-Arabic school takes the type of its level (« franco-arabe » belongs
-- in its aliases). Not kept:
-- « Case de santé », « Gouvernance », « Conseil départemental » (no usual
-- counter for users), « École franco-arabe », prisons (to be discussed with
-- the organisation running the platform). Courts of every level are one type:
-- the user's experience at the registry is the same, and the name says which.
-- Rule: a type exists only to group places not grouped otherwise (no common
-- organisation, a sector mixing very different places) or to ask questions
-- of its own. Hence none for Electricity, Water, Telecoms (the organisation
-- groups its agencies), nor for bus lines, railway stations or ships
-- (operators and services already cover them), nor for Food service,
-- Hospitality, Real estate, Banking and insurance (similar places, or grouped
-- by their organisation; hotels may get a star rating later).

INSERT INTO establishment_type (code, sector_id)
SELECT v.code, s.id
FROM (VALUES
  ('HOSPITAL', 'HEALTH'),
  ('HEALTH_CENTER', 'HEALTH'),
  ('HEALTH_POST', 'HEALTH'),
  ('CLINIC', 'HEALTH'),
  ('MEDICAL_OFFICE', 'HEALTH'),
  ('MEDICAL_LABORATORY', 'HEALTH'),
  ('MEDICAL_IMAGING_CENTER', 'HEALTH'),
  ('PHARMACY', 'HEALTH'),
  ('TOWN_HALL', 'ADMINISTRATION'),
  ('CIVIL_REGISTRY_CENTER', 'ADMINISTRATION'),
  ('PREFECTURE', 'ADMINISTRATION'),
  ('SUB_PREFECTURE', 'ADMINISTRATION'),
  ('ID_DOCUMENT_CENTER', 'ADMINISTRATION'),
  ('PRESCHOOL', 'EDUCATION'),
  ('PRIMARY_SCHOOL', 'EDUCATION'),
  ('MIDDLE_SCHOOL', 'EDUCATION'),
  ('HIGH_SCHOOL', 'EDUCATION'),
  ('SCHOOL_GROUP', 'EDUCATION'),
  ('UNIVERSITY', 'EDUCATION'),
  ('HIGHER_EDUCATION_SCHOOL', 'EDUCATION'),
  ('VOCATIONAL_TRAINING_CENTER', 'EDUCATION'),
  ('DAARA', 'EDUCATION'),
  -- The education inspectorates are offices for paperwork (transfer,
  -- certificate): in Administration, with its questions, not the classroom ones.
  ('ACADEMY_INSPECTORATE', 'ADMINISTRATION'),
  ('EDUCATION_INSPECTORATE', 'ADMINISTRATION'),
  ('COURT', 'JUSTICE'),
  ('JUSTICE_HOUSE', 'JUSTICE'),
  ('NOTARY_OFFICE', 'JUSTICE'),
  ('BAILIFF_OFFICE', 'JUSTICE'),
  ('LAW_FIRM', 'JUSTICE'),
  ('POLICE_STATION', 'SECURITY'),
  ('POLICE_POST', 'SECURITY'),
  ('GENDARMERIE_BRIGADE', 'SECURITY'),
  ('TAX_OFFICE', 'TAX'),
  ('STATE_PROPERTY_OFFICE', 'TAX'),
  ('CADASTRE_OFFICE', 'TAX'),
  ('LAND_REGISTRY', 'TAX'),
  ('CUSTOMS_OFFICE', 'TAX'),
  ('TREASURY_OFFICE', 'TAX'),
  ('SOCIAL_SECURITY_OFFICE', 'SOCIAL'),
  ('LABOUR_INSPECTORATE', 'SOCIAL'),
  ('EMPLOYMENT_OFFICE', 'SOCIAL'),
  ('SOCIAL_ACTION_OFFICE', 'SOCIAL'),
  ('SOCIAL_REINTEGRATION_CENTER', 'SOCIAL'),
  ('BUS_STATION', 'TRANSPORT'),
  ('DRIVING_LICENCE_CENTER', 'TRANSPORT'),
  ('MARKET', 'RETAIL'),
  ('SUPERMARKET', 'RETAIL'),
  ('NEIGHBOURHOOD_SHOP', 'RETAIL'),
  ('FUEL_STATION', 'RETAIL'),
  ('MUSEUM', 'CULTURE'),
  ('LIBRARY', 'CULTURE'),
  ('CULTURAL_CENTER', 'CULTURE'),
  ('CINEMA_OR_THEATRE', 'CULTURE'),
  ('STADIUM_OR_ARENA', 'SPORT'),
  ('GYM', 'SPORT'),
  ('SWIMMING_POOL', 'SPORT'),
  ('TRAVEL_AGENCY', 'TOURISM'),
  ('TOURIST_SITE', 'TOURISM')
) AS v (code, sector)
JOIN sector s ON s.code = v.sector;

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('HOSPITAL', 'Hôpital'),
  ('HEALTH_CENTER', 'Centre de santé'),
  ('HEALTH_POST', 'Poste de santé'),
  ('CLINIC', 'Clinique'),
  ('MEDICAL_OFFICE', 'Cabinet médical ou dentaire'),
  ('MEDICAL_LABORATORY', 'Laboratoire d''analyses'),
  ('MEDICAL_IMAGING_CENTER', 'Centre d''imagerie médicale'),
  ('PHARMACY', 'Pharmacie'),
  ('TOWN_HALL', 'Mairie'),
  ('CIVIL_REGISTRY_CENTER', 'Centre d''état civil'),
  ('PREFECTURE', 'Préfecture'),
  ('SUB_PREFECTURE', 'Sous-préfecture'),
  ('ID_DOCUMENT_CENTER', 'Centre de carte d''identité ou de passeport'),
  ('PRESCHOOL', 'Case des tout-petits ou école maternelle'),
  ('PRIMARY_SCHOOL', 'École élémentaire'),
  ('MIDDLE_SCHOOL', 'Collège (CEM)'),
  ('HIGH_SCHOOL', 'Lycée'),
  ('SCHOOL_GROUP', 'Groupe scolaire (plusieurs niveaux)'),
  ('UNIVERSITY', 'Université'),
  ('HIGHER_EDUCATION_SCHOOL', 'École ou institut d''enseignement supérieur'),
  ('VOCATIONAL_TRAINING_CENTER', 'Centre de formation professionnelle'),
  ('DAARA', 'Daara'),
  ('ACADEMY_INSPECTORATE', 'Inspection d''académie'),
  ('EDUCATION_INSPECTORATE', 'Inspection de l''éducation et de la formation (IEF)'),
  ('COURT', 'Tribunal ou cour'),
  ('JUSTICE_HOUSE', 'Maison de justice'),
  ('NOTARY_OFFICE', 'Étude de notaire'),
  ('BAILIFF_OFFICE', 'Étude d''huissier'),
  ('LAW_FIRM', 'Cabinet d''avocat'),
  ('POLICE_STATION', 'Commissariat de police'),
  ('POLICE_POST', 'Poste de police'),
  ('GENDARMERIE_BRIGADE', 'Brigade de gendarmerie'),
  ('TAX_OFFICE', 'Centre des services fiscaux'),
  ('STATE_PROPERTY_OFFICE', 'Service des domaines'),
  ('CADASTRE_OFFICE', 'Service du cadastre'),
  ('LAND_REGISTRY', 'Conservation foncière'),
  ('CUSTOMS_OFFICE', 'Bureau des douanes'),
  ('TREASURY_OFFICE', 'Perception du Trésor'),
  ('SOCIAL_SECURITY_OFFICE', 'Agence de sécurité sociale ou de retraite'),
  ('LABOUR_INSPECTORATE', 'Inspection du travail'),
  ('EMPLOYMENT_OFFICE', 'Service de l''emploi'),
  ('SOCIAL_ACTION_OFFICE', 'Service de l''action sociale'),
  ('SOCIAL_REINTEGRATION_CENTER', 'Centre de promotion et de réinsertion sociale'),
  ('BUS_STATION', 'Gare routière'),
  ('DRIVING_LICENCE_CENTER', 'Centre des permis et cartes grises'),
  ('MARKET', 'Marché'),
  ('SUPERMARKET', 'Supermarché'),
  ('NEIGHBOURHOOD_SHOP', 'Boutique de quartier'),
  ('FUEL_STATION', 'Station-service'),
  ('MUSEUM', 'Musée'),
  ('LIBRARY', 'Bibliothèque'),
  ('CULTURAL_CENTER', 'Centre culturel'),
  ('CINEMA_OR_THEATRE', 'Cinéma ou salle de spectacle'),
  ('STADIUM_OR_ARENA', 'Stade ou arène'),
  ('GYM', 'Salle de sport'),
  ('SWIMMING_POOL', 'Piscine'),
  ('TRAVEL_AGENCY', 'Agence de voyages'),
  ('TOURIST_SITE', 'Site touristique')
) AS v (code, label)
JOIN establishment_type t ON t.code = v.code;

-- The places already in the registry (0003) receive their type.
UPDATE establishment e
SET type_id = t.id
FROM (VALUES
  ('Hôpital Principal de Dakar', 'HOSPITAL'),
  ('Centre hospitalier national universitaire de Fann', 'HOSPITAL'),
  ('Centre hospitalier national d''enfants Albert Royer', 'HOSPITAL'),
  ('Hôpital Général Idrissa Pouye', 'HOSPITAL'),
  ('Centre hospitalier Abass Ndao', 'HOSPITAL'),
  ('Centre hospitalier national Dalal Jamm', 'HOSPITAL'),
  ('Centre hospitalier Roi Baudouin de Guédiawaye', 'HOSPITAL'),
  ('Hôpital régional El Hadji Amadou Sakhir Ndiéguène', 'HOSPITAL'),
  ('Mairie de la Ville de Dakar', 'TOWN_HALL'),
  ('Mairie de Dakar-Plateau', 'TOWN_HALL'),
  ('Mairie de Grand Yoff', 'TOWN_HALL'),
  ('Mairie des Parcelles Assainies', 'TOWN_HALL'),
  ('Mairie de la Médina', 'TOWN_HALL'),
  ('Mairie de la Ville de Thiès', 'TOWN_HALL'),
  ('Direction de l''Automatisation des Fichiers', 'ID_DOCUMENT_CENTER'),
  ('Université Cheikh Anta Diop de Dakar', 'UNIVERSITY'),
  ('Université Gaston Berger de Saint-Louis', 'UNIVERSITY'),
  ('Lycée Lamine Guèye', 'HIGH_SCHOOL')
) AS v (name, type)
JOIN establishment_type t ON t.code = v.type
WHERE e.name = v.name AND e.organization_id IS NULL;

-- The Transport sector has no list of its own: the driving licence and
-- registration centre gets the list of the services with a file (validated
-- on 2026-10-02).
UPDATE establishment_type
SET question_set_id = (SELECT id FROM question_set WHERE code = 'FILE_SERVICES')
WHERE code = 'DRIVING_LICENCE_CENTER';

-- One wording for every health place: a pharmacy, a laboratory or an imaging
-- centre gives medicines or tests, not care (validated on 2026-10-02).
UPDATE question_translation
SET label = 'Avez-vous reçu ce pour quoi vous étiez venu(e) (soins, médicaments, examen) ?'
WHERE language = 'fr'
  AND question_id = (SELECT id FROM question WHERE code = 'CARE_RECEIVED');

-- Questions of the places of passage (validated on 2026-10-02, short
-- version): facts about what the manager of the place controls. What depends
-- on the airline or the carrier (luggage, price, departure) is left to them.
-- Accessibility and cleanliness of the premises are already themes of screen
-- 2b; the overall quality is the essential question.
INSERT INTO question (code, type) VALUES
  ('WAYFINDING', 'yes_partial_no'),
  ('CHECKS_WAIT', 'single_choice'),
  ('SEAT_TO_WAIT', 'yes_partial_no'),
  ('TOILETS', 'single_choice'),
  ('TRANSPORT_ACCESS', 'yes_partial_no');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('WAYFINDING', 'Avez-vous trouvé facilement votre chemin (panneaux, annonces, indications) ?'),
  ('CHECKS_WAIT', 'Combien de temps avez-vous attendu aux contrôles (police, sécurité, douane) ?'),
  ('SEAT_TO_WAIT', 'Avez-vous trouvé une place assise pour attendre ?'),
  ('TOILETS', 'Les toilettes étaient-elles propres et en état de marche ?'),
  ('TRANSPORT_ACCESS', 'Avez-vous trouvé facilement un transport pour venir ou repartir ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('WAYFINDING', 'YES', 3, 1),
  ('WAYFINDING', 'PARTLY', 2, 2),
  ('WAYFINDING', 'NO', 1, 3),
  ('CHECKS_WAIT', 'UNDER_15_MIN', 1, 1),
  ('CHECKS_WAIT', '15_TO_30_MIN', 2, 2),
  ('CHECKS_WAIT', '30_MIN_TO_1_H', 3, 3),
  ('CHECKS_WAIT', 'OVER_1_H', 4, 4),
  ('SEAT_TO_WAIT', 'YES', 3, 1),
  ('SEAT_TO_WAIT', 'PARTLY', 2, 2),
  ('SEAT_TO_WAIT', 'NO', 1, 3),
  ('TOILETS', 'YES', 3, 1),
  ('TOILETS', 'PARTLY', 2, 2),
  ('TOILETS', 'NO', 1, 3),
  ('TOILETS', 'NOT_USED', NULL, 4),
  ('TRANSPORT_ACCESS', 'YES', 3, 1),
  ('TRANSPORT_ACCESS', 'PARTLY', 2, 2),
  ('TRANSPORT_ACCESS', 'NO', 1, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM (VALUES
  ('WAYFINDING', 'YES', 'Oui'),
  ('WAYFINDING', 'PARTLY', 'Avec difficulté'),
  ('WAYFINDING', 'NO', 'Non'),
  ('CHECKS_WAIT', 'UNDER_15_MIN', 'Moins de 15 minutes'),
  ('CHECKS_WAIT', '15_TO_30_MIN', '15 à 30 minutes'),
  ('CHECKS_WAIT', '30_MIN_TO_1_H', '30 minutes à 1 heure'),
  ('CHECKS_WAIT', 'OVER_1_H', 'Plus d''1 heure'),
  ('SEAT_TO_WAIT', 'YES', 'Oui'),
  ('SEAT_TO_WAIT', 'PARTLY', 'Avec difficulté'),
  ('SEAT_TO_WAIT', 'NO', 'Non'),
  ('TOILETS', 'YES', 'Oui'),
  ('TOILETS', 'PARTLY', 'En partie'),
  ('TOILETS', 'NO', 'Non'),
  ('TOILETS', 'NOT_USED', 'Je n''y suis pas allé(e)'),
  ('TRANSPORT_ACCESS', 'YES', 'Oui'),
  ('TRANSPORT_ACCESS', 'PARTLY', 'Avec difficulté'),
  ('TRANSPORT_ACCESS', 'NO', 'Non')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

-- One list per type (a type has one list); the questions shared by both are
-- the same questions of the bank, so their answers compare.
INSERT INTO question_set (code) VALUES ('AIRPORT'), ('BUS_STATION');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('AIRPORT', 'WAYFINDING', 1),
  ('AIRPORT', 'CHECKS_WAIT', 2),
  ('AIRPORT', 'SEAT_TO_WAIT', 3),
  ('AIRPORT', 'TOILETS', 4),
  ('AIRPORT', 'TRANSPORT_ACCESS', 5),
  ('BUS_STATION', 'WAYFINDING', 1),
  ('BUS_STATION', 'SEAT_TO_WAIT', 2),
  ('BUS_STATION', 'TOILETS', 3),
  ('BUS_STATION', 'TRANSPORT_ACCESS', 4)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

UPDATE establishment_type t
SET question_set_id = qs.id
FROM question_set qs
WHERE (t.code, qs.code) IN (('AIRPORT', 'AIRPORT'), ('BUS_STATION', 'BUS_STATION'));
