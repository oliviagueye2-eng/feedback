-- Sectors: transport covers both public and private operators; new sectors
-- for banking and insurance, culture, sport and telecoms.

UPDATE sector SET code = 'TRANSPORT' WHERE code = 'PUBLIC_TRANSPORT';

INSERT INTO sector (code) VALUES
  ('BANKING_INSURANCE'), ('CULTURE'), ('SPORT'), ('TELECOM');

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'sector', s.id, 'fr', v.label
FROM (VALUES
  ('BANKING_INSURANCE', 'Banques et assurances'),
  ('CULTURE', 'Culture'),
  ('SPORT', 'Sport'),
  ('TELECOM', 'Télécoms')
) AS v (code, label)
JOIN sector s ON s.code = v.code;
