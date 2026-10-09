-- 0071: the hospital's paths (decided by Olivia, 2026-10-09,
-- /mnt/project-files/questionnaire/validation-sante.md, point B). Each keeps
-- the care form of its type (0070) and adds its own:
--   EMERGENCY « Les urgences »: how fast one is seen; asked to pay before care;
--   CONSULTATION « Une consultation »: the appointment;
--   HOSPITAL_STAY « Une hospitalisation »: room, meals, carers' rounds,
--     relatives' visits; the follow-up after leaving explained;
--   MATERNITY « La maternité »: what the visit was for; support during the
--     birth and the newborn's care after « Un accouchement ».
-- Hospitals and clinics get the four, health centres the maternity.
-- « Autre démarche »: the care form alone.

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('EMERGENCY_RESPONSE', 1, 'DELAYS'),
  ('APPOINTMENT', 2, 'DELAYS'),
  ('ROOM_AND_BED', 3, 'PREMISES'),
  ('HOSPITAL_MEALS', 4, 'SERVICE_QUALITY'),
  ('CARE_ROUNDS', 5, 'STAFF'),
  ('RELATIVES_VISITS', 6, 'SERVICE_QUALITY'),
  ('BIRTH_SUPPORT', 7, 'STAFF'),
  ('NEWBORN_CARE', 8, 'OUTCOME')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('EMERGENCY_RESPONSE', 'Rapidité de la prise en charge (vu vite par un soignant)'),
  ('APPOINTMENT', 'Rendez-vous (facile à obtenir, heure respectée)'),
  ('ROOM_AND_BED', 'Chambre et literie'),
  ('HOSPITAL_MEALS', 'Repas'),
  ('CARE_ROUNDS', 'Passages des soignants (suivi, écoute)'),
  ('RELATIVES_VISITS', 'Visites des proches (horaires, accueil)'),
  ('BIRTH_SUPPORT', 'Accompagnement pendant l''accouchement'),
  ('NEWBORN_CARE', 'Soins du nouveau-né')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('EMERGENCY'), ('CONSULTATION'), ('HOSPITAL_STAY'), ('MATERNITY');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('EMERGENCY', 'EMERGENCY_RESPONSE'),
  ('CONSULTATION', 'APPOINTMENT'),
  ('HOSPITAL_STAY', 'ROOM_AND_BED'), ('HOSPITAL_STAY', 'HOSPITAL_MEALS'), ('HOSPITAL_STAY', 'CARE_ROUNDS'),
  ('HOSPITAL_STAY', 'RELATIVES_VISITS'),
  ('MATERNITY', 'BIRTH_SUPPORT'), ('MATERNITY', 'NEWBORN_CARE')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- What the visit was for is a fact (no category).
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('PAID_BEFORE_CARE', 'COST'), ('DISCHARGE_EXPLAINED', 'STAFF'), ('MATERNITY_VISIT_KIND', NULL))
  AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('PAID_BEFORE_CARE', 'Vous a-t-on demandé de payer avant de vous soigner ?'),
  ('DISCHARGE_EXPLAINED', 'Vous a-t-on expliqué la suite à votre sortie (traitement, suivi) ?'),
  ('MATERNITY_VISIT_KIND', 'Votre visite concernait :')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('PAID_BEFORE_CARE', 'YES', 1, 1), ('PAID_BEFORE_CARE', 'NO', 2, 2),
  ('DISCHARGE_EXPLAINED', 'YES', 3, 1), ('DISCHARGE_EXPLAINED', 'PARTLY', 2, 2), ('DISCHARGE_EXPLAINED', 'NO', 1, 3),
  ('MATERNITY_VISIT_KIND', 'PREGNANCY', NULL::int, 1), ('MATERNITY_VISIT_KIND', 'BIRTH', NULL, 2),
  ('MATERNITY_VISIT_KIND', 'POSTNATAL', NULL, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('PAID_BEFORE_CARE', 'YES', 'Oui'), ('PAID_BEFORE_CARE', 'NO', 'Non'),
  ('DISCHARGE_EXPLAINED', 'YES', 'Oui'), ('DISCHARGE_EXPLAINED', 'PARTLY', 'En partie'),
  ('DISCHARGE_EXPLAINED', 'NO', 'Non'),
  ('MATERNITY_VISIT_KIND', 'PREGNANCY', 'Une consultation de grossesse'),
  ('MATERNITY_VISIT_KIND', 'BIRTH', 'Un accouchement'),
  ('MATERNITY_VISIT_KIND', 'POSTNATAL', 'Une consultation après l''accouchement')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- The birth's topics only after « Un accouchement ».
INSERT INTO topic_condition (topic_id, depends_on_question_id, option_id)
SELECT t.id, q.id, o.id
FROM topic t, question q
JOIN answer_option o ON o.question_id = q.id AND o.code = 'BIRTH'
WHERE t.code IN ('BIRTH_SUPPORT', 'NEWBORN_CARE') AND q.code = 'MATERNITY_VISIT_KIND';

INSERT INTO question_set (code) VALUES ('EMERGENCY'), ('HOSPITAL_STAY'), ('MATERNITY');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1
FROM (VALUES ('EMERGENCY', 'PAID_BEFORE_CARE'), ('HOSPITAL_STAY', 'DISCHARGE_EXPLAINED'),
             ('MATERNITY', 'MATERNITY_VISIT_KIND')) AS v (list, question)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- ---------------------------------------------------------------------------
-- The services
-- ---------------------------------------------------------------------------
INSERT INTO service (code, synonyms) VALUES
  ('EMERGENCY', '{urgences,urgence,accident}'),
  ('CONSULTATION', '{consultation,"rendez-vous",médecin,docteur}'),
  ('HOSPITAL_STAY', '{hospitalisation,hospitalisé,chambre,séjour}'),
  ('MATERNITY', '{maternité,accouchement,grossesse,"sage-femme",bébé}');

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('EMERGENCY', 'Les urgences'),
  ('CONSULTATION', 'Une consultation'),
  ('HOSPITAL_STAY', 'Une hospitalisation'),
  ('MATERNITY', 'La maternité')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, 1 FROM service s JOIN topic_set ts ON ts.code = s.code
WHERE s.code IN ('EMERGENCY', 'CONSULTATION', 'HOSPITAL_STAY', 'MATERNITY');

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1 FROM service s JOIN question_set qs ON qs.code = s.code
WHERE s.code IN ('EMERGENCY', 'HOSPITAL_STAY', 'MATERNITY');

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN establishment_type et ON et.id = e.type_id
JOIN service s ON s.code IN ('EMERGENCY', 'CONSULTATION', 'HOSPITAL_STAY', 'MATERNITY')
WHERE et.code IN ('HOSPITAL', 'CLINIC')
   OR (et.code = 'HEALTH_CENTER' AND s.code = 'MATERNITY');
