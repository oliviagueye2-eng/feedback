-- Topics of screen 2b, reviewed on 2026-09-30: ten common topics shown
-- everywhere, plus topics shown only in some sectors.
--
-- New rule for topic_sector (the table was not used yet): a topic with no
-- row in topic_sector is common and shown in every sector; a topic with rows
-- is shown only in those sectors.
--
-- Topics that leave the list are deactivated, not deleted: feedback already
-- given with them stays readable.

UPDATE topic SET is_active = false
WHERE code IN ('PRICE', 'ACCESSIBILITY', 'SAFETY', 'SERVICE_QUALITY');

-- Kept topics: new order, and some new labels.
UPDATE topic t SET position = v.position
FROM (VALUES
  ('STAFF', 1), ('WAIT_TIME', 3), ('INFORMATION', 4), ('CLEANLINESS', 8), ('OTHER', 99)
) AS v (code, position)
WHERE t.code = v.code;

UPDATE translation tr SET text = v.label
FROM (VALUES
  ('STAFF', 'Accueil et politesse'),
  ('WAIT_TIME', 'Temps d''attente'),
  ('INFORMATION', 'Explications reçues'),
  ('CLEANLINESS', 'Propreté et confort des locaux')
) AS v (code, label)
JOIN topic t ON t.code = v.code
WHERE tr.target_table = 'topic' AND tr.target_id = t.id AND tr.field = 'label' AND tr.language = 'fr';

-- New topics. "Autre" (99) stays last; sector topics come after the common ones.
INSERT INTO topic (code, position) VALUES
  ('PROFESSIONALISM', 2),
  ('PROCEDURE', 5),
  ('OPENING_HOURS', 6),
  ('FEES', 7),
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
  ('CUSTOMER_SERVICE', 38);

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'topic', t.id, 'fr', v.label
FROM (VALUES
  ('PROFESSIONALISM', 'Professionnalisme du personnel'),
  ('PROCEDURE', 'Simplicité de la démarche (papiers, allers-retours)'),
  ('OPENING_HOURS', 'Horaires d''ouverture'),
  ('FEES', 'Frais payés (montant, reçu)'),
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
  ('CUSTOMER_SERVICE', 'Service client et réclamations')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

-- Sector topics.
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
