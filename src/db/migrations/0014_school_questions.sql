-- The schools' questions follow the visit chosen, like their topics (0009):
-- the Education list stayed on the sector, so the enrolment or a paper at the
-- office asked about the classes, the class size and the toilets. The sector
-- keeps who answers; the classes go to « Les cours et la vie de l'école », the
-- payment to « Inscription ou démarche administrative », which also gets the
-- questions of the administrative offices (validated on 2026-10-03). The other education
-- places (university, preschool, daara…) keep exactly the questions they had,
-- in the same order, through a list on their type.
INSERT INTO question_set (code) VALUES ('OTHER_EDUCATION'), ('SCHOOL_ADMIN'), ('SCHOOL_LIFE');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('OTHER_EDUCATION', 'CLASSES_HELD', 1),
  ('OTHER_EDUCATION', 'CLASS_SIZE', 2),
  ('OTHER_EDUCATION', 'FACILITIES', 3),
  ('OTHER_EDUCATION', 'PAID_SOMETHING', 4),
  ('OTHER_EDUCATION', 'RECEIPT_GIVEN', 5),
  ('SCHOOL_ADMIN', 'GOAL_ACHIEVED', 1),
  ('SCHOOL_ADMIN', 'VISITS_COUNT', 2),
  ('SCHOOL_ADMIN', 'WAIT_TIME', 3),
  ('SCHOOL_ADMIN', 'DOCUMENTS_KNOWN', 4),
  ('SCHOOL_ADMIN', 'PAID_SOMETHING', 5),
  ('SCHOOL_ADMIN', 'RECEIPT_GIVEN', 6),
  ('SCHOOL_LIFE', 'CLASSES_HELD', 1),
  ('SCHOOL_LIFE', 'CLASS_SIZE', 2),
  ('SCHOOL_LIFE', 'FACILITIES', 3)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, o.id
FROM question_set qs, question q, question dq
JOIN answer_option o ON o.question_id = dq.id AND o.code = 'YES'
WHERE qs.code IN ('OTHER_EDUCATION', 'SCHOOL_ADMIN') AND q.code = 'RECEIPT_GIVEN' AND dq.code = 'PAID_SOMETHING';

-- The Education list keeps only « Vous êtes : » (its conditions go with the
-- questions removed).
DELETE FROM question_set_item
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'EDUCATION')
  AND question_id IN (SELECT id FROM question WHERE code <> 'RESPONDENT');

UPDATE establishment_type SET question_set_id = (SELECT id FROM question_set WHERE code = 'OTHER_EDUCATION')
WHERE code IN ('UNIVERSITY', 'HIGHER_EDUCATION_SCHOOL', 'VOCATIONAL_TRAINING_CENTER', 'PRESCHOOL', 'DAARA');

UPDATE service s SET question_set_id = qs.id
FROM question_set qs
WHERE qs.code = s.code AND s.code IN ('SCHOOL_ADMIN', 'SCHOOL_LIFE');
