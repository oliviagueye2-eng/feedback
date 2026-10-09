-- 0072: the education forms (decided by Olivia, 2026-10-09,
-- /mnt/project-files/questionnaire/validation-education.md):
--   preschool: a form of its own, the children's activities and care, whether
--     the child is happy to go, the toilets and water;
--   daara: a form of its own, the children's living conditions after « Oui »
--     to whether they sleep there;
--   the university's courses: « Encadrement des étudiants », enough seats
--     instead of the class size, the library, the computer rooms;
--   the school fees (recurring, closer to a bill), always shown, in the
--     courses of schools and universities, the preschool and the daara;
--   « Autre démarche »: the counter's blocks and the results' questions, as
--     in the other sectors, for the types whose places offer paths. A type's
--     list marked only_without_service (new, like the sector's in 0053) goes
--     only to a feedback without a service.

ALTER TABLE establishment_type_topic_set ADD COLUMN only_without_service boolean NOT NULL DEFAULT false;
ALTER TABLE establishment_type_question_set ADD COLUMN only_without_service boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('CHILD_ACTIVITIES', 1, 'SERVICE_QUALITY'),
  ('CHILD_CARE', 2, 'STAFF'),
  ('CHILD_LIVING_CONDITIONS', 3, 'SERVICE_QUALITY'),
  ('STUDENT_SUPERVISION_HIGHER', 4, 'STAFF'),
  ('LIBRARY', 5, 'PREMISES'),
  ('COMPUTER_ROOMS', 6, 'PREMISES'),
  ('SCHOOL_FEES', 7, 'COST')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('CHILD_ACTIVITIES', 'Éveil et activités des enfants'),
  ('CHILD_CARE', 'Surveillance et soins des enfants'),
  ('CHILD_LIVING_CONDITIONS', 'Conditions de vie des enfants (repas, couchage, santé)'),
  ('STUDENT_SUPERVISION_HIGHER', 'Encadrement des étudiants'),
  ('LIBRARY', 'Bibliothèque (accès, horaires, ouvrages)'),
  ('COMPUTER_ROOMS', 'Salles informatiques et matériel (accès, état)'),
  ('SCHOOL_FEES', 'Frais de scolarité et cotisations (montant connu à l''avance, reçu remis)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- Whether the children sleep there is a fact (no category).
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES ('CHILD_HAPPY', 'OUTCOME'), ('DAARA_BOARDING', NULL), ('ENOUGH_SEATS', 'PREMISES')) AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('CHILD_HAPPY', 'Votre enfant est-il content d''y aller ?'),
  ('DAARA_BOARDING', 'Les enfants dorment-ils au daara ?'),
  ('ENOUGH_SEATS', 'Y avait-il assez de places dans les salles ou amphis ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM (VALUES
  ('CHILD_HAPPY', 'YES', 3, 1), ('CHILD_HAPPY', 'SOMETIMES', 2, 2), ('CHILD_HAPPY', 'NO', 1, 3),
  ('DAARA_BOARDING', 'YES', NULL::int, 1), ('DAARA_BOARDING', 'NO', NULL, 2),
  ('ENOUGH_SEATS', 'YES', 3, 1), ('ENOUGH_SEATS', 'SOMETIMES', 2, 2), ('ENOUGH_SEATS', 'NO', 1, 3)
) AS v (question, option, value, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('CHILD_HAPPY', 'YES', 'Oui'), ('CHILD_HAPPY', 'SOMETIMES', 'Parfois'), ('CHILD_HAPPY', 'NO', 'Non'),
  ('DAARA_BOARDING', 'YES', 'Oui'), ('DAARA_BOARDING', 'NO', 'Non'),
  ('ENOUGH_SEATS', 'YES', 'Oui'), ('ENOUGH_SEATS', 'SOMETIMES', 'Parfois'), ('ENOUGH_SEATS', 'NO', 'Non')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

-- The living conditions only after « Oui ».
INSERT INTO topic_condition (topic_id, depends_on_question_id, option_id)
SELECT t.id, q.id, o.id
FROM topic t, question q
JOIN answer_option o ON o.question_id = q.id AND o.code = 'YES'
WHERE t.code = 'CHILD_LIVING_CONDITIONS' AND q.code = 'DAARA_BOARDING';

-- ---------------------------------------------------------------------------
-- Topic lists
-- ---------------------------------------------------------------------------
INSERT INTO topic_set (code) VALUES ('PRESCHOOL'), ('DAARA');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('PRESCHOOL', 'CHILD_ACTIVITIES'), ('PRESCHOOL', 'CHILD_CARE'), ('PRESCHOOL', 'PARENT_COMMUNICATION'),
  ('PRESCHOOL', 'SCHOOL_SAFETY'), ('PRESCHOOL', 'SCHOOL_FEES'),
  ('DAARA', 'TEACHING_QUALITY'), ('DAARA', 'STUDENT_SUPERVISION'), ('DAARA', 'PARENT_COMMUNICATION'),
  ('DAARA', 'CHILD_LIVING_CONDITIONS'), ('DAARA', 'SCHOOL_SAFETY'), ('DAARA', 'SCHOOL_FEES'),
  ('SCHOOL_LIFE', 'SCHOOL_FEES'),
  ('HIGHER_EDUCATION_COURSES', 'STUDENT_SUPERVISION_HIGHER'), ('HIGHER_EDUCATION_COURSES', 'LIBRARY'),
  ('HIGHER_EDUCATION_COURSES', 'COMPUTER_ROOMS'), ('HIGHER_EDUCATION_COURSES', 'SCHOOL_FEES')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'HIGHER_EDUCATION_COURSES')
  AND topic_id = (SELECT id FROM topic WHERE code = 'STUDENT_SUPERVISION');

-- ---------------------------------------------------------------------------
-- Question lists
-- ---------------------------------------------------------------------------
INSERT INTO question_set (code) VALUES ('HIGHER_EDUCATION_COURSES'), ('DAARA');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('PRESCHOOL', 'CHILD_HAPPY', 2), ('PRESCHOOL', 'FACILITIES', 3),
  ('HIGHER_EDUCATION_COURSES', 'CLASSES_HELD', 1), ('HIGHER_EDUCATION_COURSES', 'ENOUGH_SEATS', 2),
  ('HIGHER_EDUCATION_COURSES', 'FACILITIES', 3),
  ('DAARA', 'DAARA_BOARDING', 1)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

UPDATE service_question_set
SET question_set_id = (SELECT id FROM question_set WHERE code = 'HIGHER_EDUCATION_COURSES')
WHERE service_id = (SELECT id FROM service WHERE code = 'HIGHER_EDUCATION_COURSES');

-- ---------------------------------------------------------------------------
-- The types' lists
-- ---------------------------------------------------------------------------
INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, 1 FROM establishment_type et JOIN topic_set ts ON ts.code = et.code
WHERE et.code IN ('PRESCHOOL', 'DAARA');

INSERT INTO establishment_type_question_set (type_id, question_set_id, position)
SELECT et.id, qs.id, 2 FROM establishment_type et, question_set qs
WHERE et.code = 'DAARA' AND qs.code = 'DAARA';

-- « Autre démarche » for the types whose places offer paths.
INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position, only_without_service)
SELECT et.id, ts.id, v.position, true
FROM establishment_type et,
     (VALUES ('STAFF_SKILLS', 1), ('COUNTER', 2), ('FEES', 3)) AS v (list, position)
JOIN topic_set ts ON ts.code = v.list
WHERE et.code IN ('PRIMARY_SCHOOL', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'SCHOOL_GROUP', 'UNIVERSITY',
                  'HIGHER_EDUCATION_SCHOOL', 'VOCATIONAL_TRAINING_CENTER');

INSERT INTO establishment_type_question_set (type_id, question_set_id, position, only_without_service)
SELECT et.id, qs.id, v.position, true
FROM establishment_type et,
     (VALUES ('FILE_SERVICES', 2), ('PAID_AND_RECEIPT', 3)) AS v (list, position)
JOIN question_set qs ON qs.code = v.list
WHERE et.code IN ('PRIMARY_SCHOOL', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'SCHOOL_GROUP', 'UNIVERSITY',
                  'HIGHER_EDUCATION_SCHOOL', 'VOCATIONAL_TRAINING_CENTER');
