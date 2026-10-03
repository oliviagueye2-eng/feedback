-- Universities and higher education schools are rated for two visits, like
-- the schools (validated on 2026-10-03): a paper at the office (enrolment,
-- grant, transcript, diploma) and the courses and exams. One service each,
-- each with its topics; the questions are the schools' lists.

-- A new topic for the courses: the year that slips, the marks published late.
INSERT INTO topic (code, position, category_id)
SELECT 'ACADEMIC_CALENDAR', 15, id FROM evaluation_category WHERE code = 'DELAYS';

INSERT INTO topic_translation (topic_id, language, label)
SELECT id, 'fr', 'Respect du calendrier (examens, publication des notes)'
FROM topic WHERE code = 'ACADEMIC_CALENDAR';

INSERT INTO topic_set (code) VALUES ('HIGHER_EDUCATION_ADMIN'), ('HIGHER_EDUCATION_COURSES');

-- « Compétence du personnel » comes from COMMON, « Propreté » and
-- « Accessibilité » from the Education sector.
INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('HIGHER_EDUCATION_ADMIN', 'STAFF'), ('HIGHER_EDUCATION_ADMIN', 'INFORMATION'),
  ('HIGHER_EDUCATION_ADMIN', 'WAIT_TIME'), ('HIGHER_EDUCATION_ADMIN', 'PROCESSING_TIME'),
  ('HIGHER_EDUCATION_ADMIN', 'PROCEDURE'), ('HIGHER_EDUCATION_ADMIN', 'CASE_TRACKING'),
  ('HIGHER_EDUCATION_ADMIN', 'OPENING_HOURS'), ('HIGHER_EDUCATION_ADMIN', 'FEES'),
  ('HIGHER_EDUCATION_COURSES', 'STUDENT_SUPERVISION'), ('HIGHER_EDUCATION_COURSES', 'PARENT_COMMUNICATION'),
  ('HIGHER_EDUCATION_COURSES', 'TEACHING_QUALITY'), ('HIGHER_EDUCATION_COURSES', 'ACADEMIC_CALENDAR'),
  ('HIGHER_EDUCATION_COURSES', 'SCHOOL_SAFETY')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

-- Their topics and questions now come from the service chosen.
UPDATE establishment_type SET topic_set_id = NULL, question_set_id = NULL
WHERE code IN ('UNIVERSITY', 'HIGHER_EDUCATION_SCHOOL');

INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[]
FROM (VALUES
  ('HIGHER_EDUCATION_ADMIN', 'SCHOOL_ADMIN',
   '{inscription,réinscription,bourse,relevé de notes,diplôme,attestation}'),
  ('HIGHER_EDUCATION_COURSES', 'SCHOOL_LIFE', '{cours,examen,notes,professeur,enseignant,amphi}')
) AS v (code, questions, synonyms)
JOIN sector s ON s.code = 'EDUCATION'
JOIN topic_set ts ON ts.code = v.code
JOIN question_set qs ON qs.code = v.questions;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('HIGHER_EDUCATION_ADMIN', 'Inscription ou démarche administrative'),
  ('HIGHER_EDUCATION_COURSES', 'Les cours et les examens')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN establishment_type et ON et.id = e.type_id AND et.code IN ('UNIVERSITY', 'HIGHER_EDUCATION_SCHOOL')
JOIN service s ON s.code IN ('HIGHER_EDUCATION_ADMIN', 'HIGHER_EDUCATION_COURSES');
