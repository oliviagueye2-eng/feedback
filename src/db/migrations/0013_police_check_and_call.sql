-- Police and gendarmerie outside the station: a check and a call for help no
-- longer share one service (validated on 2026-10-03). « Un contrôle ou une
-- intervention sur le terrain » becomes « Un contrôle » (same code, so the
-- feedbacks already given keep their service), and « Une demande
-- d'intervention » is a new service. The service now says what it was:
-- « De quoi s'agissait-il ? » (and its « Une interpellation ») is no longer
-- asked; it stays in the bank for the answers already given.

-- ---------------------------------------------------------------------------
-- « Un contrôle »
-- ---------------------------------------------------------------------------
UPDATE service_translation SET label = 'Un contrôle (routier, papiers, barrage)'
WHERE language = 'fr' AND service_id = (SELECT id FROM service WHERE code = 'POLICE_FIELD');

UPDATE service SET synonyms = '{contrôle routier,contrôle,contrôle de papiers,barrage,patrouille,amende}'
WHERE code = 'POLICE_FIELD';

-- No delay of intervention for a check.
DELETE FROM topic_set_item
WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'POLICE_FIELD')
  AND topic_id = (SELECT id FROM topic WHERE code = 'INTERVENTION_TIME');

-- Their conditions go with the list items (ON DELETE CASCADE).
DELETE FROM question_set_item
WHERE question_set_id = (SELECT id FROM question_set WHERE code = 'POLICE_FIELD')
  AND question_id IN (SELECT id FROM question WHERE code IN ('FIELD_SITUATION', 'ARRIVAL_TIME'));

UPDATE question_translation SET label = 'L''agent vous a-t-il expliqué la raison du contrôle ?'
WHERE language = 'fr' AND question_id = (SELECT id FROM question WHERE code = 'REASON_EXPLAINED');

-- ---------------------------------------------------------------------------
-- « Une demande d'intervention »
-- ---------------------------------------------------------------------------
INSERT INTO topic_set (code) VALUES ('POLICE_CALL');
INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id FROM topic_set s, topic t
WHERE s.code = 'POLICE_CALL' AND t.code = 'INTERVENTION_TIME';

-- The time the officers took to come, always asked here.
INSERT INTO question_set (code) VALUES ('POLICE_CALL');
INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 1 FROM question_set qs, question q
WHERE qs.code = 'POLICE_CALL' AND q.code = 'ARRIVAL_TIME';

INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT 'POLICE_CALL', s.id, ts.id, qs.id,
       '{intervention,demande d''intervention,appel,appeler la police,police secours,17,800 00 20 20,secours,agression,vol}'
FROM sector s, topic_set ts, question_set qs
WHERE s.code = 'SECURITY' AND ts.code = 'POLICE_CALL' AND qs.code = 'POLICE_CALL';

INSERT INTO service_translation (service_id, language, label)
SELECT id, 'fr', 'Une demande d''intervention (après un appel)' FROM service WHERE code = 'POLICE_CALL';

-- Offered wherever the check is: both organisations, every station, post or brigade.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT es.establishment_id, (SELECT id FROM service WHERE code = 'POLICE_CALL')
FROM establishment_service es
WHERE es.service_id = (SELECT id FROM service WHERE code = 'POLICE_FIELD');
