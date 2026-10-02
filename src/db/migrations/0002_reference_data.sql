-- Reference data: sectors and the topics of screen 2b (rewritten on
-- 2026-10-02; decisions in docs/architecture-base-de-donnees.md).

-- ---------------------------------------------------------------------------
-- Sectors (19)
-- ---------------------------------------------------------------------------

-- TOURISM: travel agencies, guides, tourist sites, tourist offices
-- (accommodation stays in HOSPITALITY, museums in CULTURE).
-- ELECTRICITY and WATER are two sectors (decision of 2026-09-29), so that
-- Senelec shows « Électricité » and Sen'Eau « Eau ». No postal sector: postal
-- services go with telecoms.
INSERT INTO sector (code) VALUES
  ('HEALTH'), ('EDUCATION'), ('ADMINISTRATION'), ('JUSTICE'), ('SECURITY'),
  ('TAX'), ('ELECTRICITY'), ('WATER'), ('TRANSPORT'), ('SOCIAL'),
  ('FOOD_SERVICE'), ('HOSPITALITY'), ('REAL_ESTATE'), ('RETAIL'),
  ('BANKING_INSURANCE'), ('CULTURE'), ('SPORT'), ('TELECOM'), ('TOURISM');

INSERT INTO sector_translation (sector_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('HEALTH', 'Santé'),
  ('EDUCATION', 'Éducation'),
  ('ADMINISTRATION', 'Administration et état civil'),
  ('JUSTICE', 'Justice'),
  ('SECURITY', 'Sécurité'),
  ('TAX', 'Impôts et domaines'),
  ('ELECTRICITY', 'Électricité'),
  ('WATER', 'Eau'),
  ('TRANSPORT', 'Transport'),
  ('SOCIAL', 'Emploi et protection sociale'),
  ('FOOD_SERVICE', 'Restauration'),
  ('HOSPITALITY', 'Hôtellerie'),
  ('REAL_ESTATE', 'Immobilier'),
  ('RETAIL', 'Commerce'),
  ('BANKING_INSURANCE', 'Banques et assurances'),
  ('CULTURE', 'Culture'),
  ('SPORT', 'Sport'),
  ('TELECOM', 'Télécoms'),
  ('TOURISM', 'Tourisme')
) AS v (code, label)
JOIN sector s ON s.code = v.code;

-- ---------------------------------------------------------------------------
-- Topics of screen 2b (reviewed on 2026-09-30): ten common topics shown in
-- every sector, then the topics of some sectors; « Autre » stays last.
-- ---------------------------------------------------------------------------

INSERT INTO topic (code, position) VALUES
  ('STAFF', 1),
  ('PROFESSIONALISM', 2),
  ('WAIT_TIME', 3),
  ('INFORMATION', 4),
  ('PROCEDURE', 5),
  ('OPENING_HOURS', 6),
  ('FEES', 7),
  ('CLEANLINESS', 8),
  ('ACCESS_FOR_ALL', 9),
  ('CARE_RECEIVED', 20),
  ('MEDICINE_AVAILABILITY', 21),
  ('PRIVACY', 22),
  ('TEACHING_QUALITY', 23),
  ('STUDENT_SUPERVISION', 24),
  ('PUNCTUALITY', 25),
  ('ONBOARD_SAFETY', 26),
  ('VEHICLE_CONDITION', 27),
  ('POWER_CUTS', 28),
  ('WATER_CUTS', 29),
  ('WATER_QUALITY', 30),
  ('NETWORK_QUALITY', 31),
  ('INTERVENTION_TIME', 32),
  ('BILLING', 33),
  ('REQUEST_HANDLING', 34),
  ('RIGHTS_RESPECT', 35),
  ('PROCESSING_TIME', 36),
  ('CASE_TRACKING', 37),
  ('CUSTOMER_SERVICE', 38),
  ('OTHER', 99);

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('STAFF', 'Accueil et politesse'),
  ('PROFESSIONALISM', 'Professionnalisme du personnel'),
  ('WAIT_TIME', 'Temps d''attente'),
  ('INFORMATION', 'Explications reçues'),
  ('PROCEDURE', 'Simplicité de la démarche (papiers, allers-retours)'),
  ('OPENING_HOURS', 'Horaires d''ouverture'),
  ('FEES', 'Frais payés (montant, reçu)'),
  ('CLEANLINESS', 'Propreté et confort des locaux'),
  ('ACCESS_FOR_ALL', 'Accès pour tous (personnes handicapées, âgées)'),
  ('CARE_RECEIVED', 'Soins reçus'),
  ('MEDICINE_AVAILABILITY', 'Médicaments et examens disponibles'),
  ('PRIVACY', 'Respect de l''intimité'),
  ('TEACHING_QUALITY', 'Qualité de l''enseignement'),
  ('STUDENT_SUPERVISION', 'Encadrement des élèves'),
  ('PUNCTUALITY', 'Ponctualité'),
  ('ONBOARD_SAFETY', 'Sécurité à bord'),
  ('VEHICLE_CONDITION', 'État des véhicules'),
  ('POWER_CUTS', 'Coupures de courant'),
  ('WATER_CUTS', 'Coupures d''eau'),
  ('WATER_QUALITY', 'Qualité de l''eau'),
  ('NETWORK_QUALITY', 'Qualité du réseau'),
  ('INTERVENTION_TIME', 'Délai d''intervention'),
  ('BILLING', 'Factures (exactes et faciles à comprendre)'),
  ('REQUEST_HANDLING', 'Prise en compte de la demande'),
  ('RIGHTS_RESPECT', 'Respect des droits'),
  ('PROCESSING_TIME', 'Délai de traitement du dossier'),
  ('CASE_TRACKING', 'Suivi et transparence du dossier'),
  ('CUSTOMER_SERVICE', 'Service client et réclamations'),
  ('OTHER', 'Autre')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_sector (topic_id, sector_id)
SELECT t.id, s.id
FROM (VALUES
  ('CARE_RECEIVED', 'HEALTH'),
  ('MEDICINE_AVAILABILITY', 'HEALTH'),
  ('PRIVACY', 'HEALTH'),
  ('TEACHING_QUALITY', 'EDUCATION'),
  ('STUDENT_SUPERVISION', 'EDUCATION'),
  ('PUNCTUALITY', 'TRANSPORT'),
  ('ONBOARD_SAFETY', 'TRANSPORT'),
  ('VEHICLE_CONDITION', 'TRANSPORT'),
  ('POWER_CUTS', 'ELECTRICITY'),
  ('INTERVENTION_TIME', 'ELECTRICITY'),
  ('WATER_CUTS', 'WATER'),
  ('WATER_QUALITY', 'WATER'),
  ('NETWORK_QUALITY', 'TELECOM'),
  ('BILLING', 'ELECTRICITY'),
  ('BILLING', 'WATER'),
  ('BILLING', 'TELECOM'),
  ('CUSTOMER_SERVICE', 'TRANSPORT'),
  ('CUSTOMER_SERVICE', 'ELECTRICITY'),
  ('CUSTOMER_SERVICE', 'WATER'),
  ('CUSTOMER_SERVICE', 'TELECOM'),
  ('CUSTOMER_SERVICE', 'BANKING_INSURANCE'),
  ('REQUEST_HANDLING', 'SECURITY'),
  ('RIGHTS_RESPECT', 'SECURITY'),
  ('PROCESSING_TIME', 'ADMINISTRATION'),
  ('PROCESSING_TIME', 'JUSTICE'),
  ('PROCESSING_TIME', 'TAX'),
  ('PROCESSING_TIME', 'SOCIAL'),
  ('PROCESSING_TIME', 'SECURITY'),
  ('PROCESSING_TIME', 'BANKING_INSURANCE'),
  ('CASE_TRACKING', 'ADMINISTRATION'),
  ('CASE_TRACKING', 'JUSTICE'),
  ('CASE_TRACKING', 'TAX'),
  ('CASE_TRACKING', 'SOCIAL'),
  ('CASE_TRACKING', 'SECURITY'),
  ('CASE_TRACKING', 'BANKING_INSURANCE')
) AS v (topic, sector)
JOIN topic t ON t.code = v.topic
JOIN sector s ON s.code = v.sector;
