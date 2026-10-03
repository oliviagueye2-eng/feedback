-- « Combien de temps les agents ont-ils mis pour arriver ? » again needs « Une
-- intervention après un appel » (as in 0010), on top of « Oui » to « Avez-vous
-- attendu une intervention sur le terrain ? » (0011): after a road check, it
-- was still asked (validated on 2026-10-03). Two questions in the conditions
-- of one item must both get one of their answers.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM question_set qs, question q, question dq
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = 'CALL_RESPONSE'
WHERE qs.code = 'POLICE_FIELD' AND q.code = 'ARRIVAL_TIME' AND dq.code = 'FIELD_SITUATION';
