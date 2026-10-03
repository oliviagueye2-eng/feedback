-- « Avez-vous attendu une intervention sur le terrain ? » (0011) is no longer
-- asked (her choice, 2026-10-03): with « De quoi s'agissait-il ? » it let a
-- user answer « Oui » then « Un contrôle routier ». « Délai d'intervention » is
-- shown again to everyone (« Non concerné » covers a road check), and « Combien
-- de temps les agents ont-ils mis pour arriver ? » again follows « Une
-- intervention après un appel » only, as in 0010. The question stays in the
-- bank for the answers already given.
--
-- Written to give the same result whether or not the first version of this
-- migration (0012_arrival_time_two_conditions) ran on a preview.
DELETE FROM topic_condition
WHERE depends_on_question_id = (SELECT id FROM question WHERE code = 'INTERVENTION_AWAITED');

DELETE FROM question_condition
WHERE depends_on_question_id = (SELECT id FROM question WHERE code = 'INTERVENTION_AWAITED');

DELETE FROM question_set_item
WHERE question_id = (SELECT id FROM question WHERE code = 'INTERVENTION_AWAITED');

INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM question_set qs, question q, question dq
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = 'CALL_RESPONSE'
WHERE qs.code = 'POLICE_FIELD' AND q.code = 'ARRIVAL_TIME' AND dq.code = 'FIELD_SITUATION'
ON CONFLICT DO NOTHING;
