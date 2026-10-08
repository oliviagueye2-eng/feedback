-- 0031: lists of their own for the Paiement mobile sector (validated by
-- Olivia, 2026-10-08). 0030 had copied those of Banques et assurances. They
-- only reach a feedback with no service (« Autre démarche », or nothing
-- chosen at screen 1): the three mobile money services replace the shared
-- lists (0026). Existing topics and question only, so the answers compare.

INSERT INTO topic_set (code) VALUES ('MOBILE_PAYMENT');

-- With COMMON (« Compétence du personnel »). « Frais payés » keeps its
-- condition: shown after « Oui » to « Avez-vous payé quelque chose ? ».
INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM topic_set s
JOIN topic t ON t.code IN ('STAFF', 'INFORMATION', 'WAIT_TIME', 'REQUEST_HANDLING', 'FEES', 'ACCOUNT_SECURITY')
WHERE s.code = 'MOBILE_PAYMENT';

INSERT INTO question_set (code) VALUES ('MOBILE_PAYMENT');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT s.id, q.id, 1
FROM question_set s
JOIN question q ON q.code = 'GOAL_ACHIEVED'
WHERE s.code = 'MOBILE_PAYMENT';

UPDATE sector
SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'MOBILE_PAYMENT'),
    question_set_id = (SELECT id FROM question_set WHERE code = 'MOBILE_PAYMENT')
WHERE code = 'MOBILE_PAYMENT';
