-- 0030: Wave, Orange Money and Mixx by Yas leave Banking and insurance for a
-- sector of their own, « Paiement mobile » (decided by Olivia, 2026-10-08):
-- mobile money is neither a bank nor an insurer for a user. Their three
-- services replace the sector's lists (0026), so the topics and questions do
-- not change; the sector keeps the Banking and insurance lists for a feedback
-- without a service, as before. Only the sector shown, filtered on and
-- compared in the results changes.

INSERT INTO sector (code, question_set_id, topic_set_id)
SELECT 'MOBILE_PAYMENT', question_set_id, topic_set_id FROM sector WHERE code = 'BANKING_INSURANCE';

INSERT INTO sector_translation (sector_id, language, label)
SELECT id, 'fr', 'Paiement mobile' FROM sector WHERE code = 'MOBILE_PAYMENT';

UPDATE organization SET sector_id = (SELECT id FROM sector WHERE code = 'MOBILE_PAYMENT')
WHERE code IN ('WAVE', 'ORANGE_MONEY', 'MIXX_BY_YAS');

UPDATE establishment e SET sector_id = o.sector_id
FROM organization o
WHERE o.id = e.organization_id AND o.code IN ('WAVE', 'ORANGE_MONEY', 'MIXX_BY_YAS');
