-- 0080: the question of « Dans quelle agence ? » by service (choice G2,
-- Olivia, 2026-10-10): « Dans quelle agence ? » does not fit the police or a
-- cash machine. Translated as the label; the screen falls back to
-- « Dans quelle agence ? » when none is written.

ALTER TABLE service_translation ADD COLUMN site_question text;

UPDATE service_translation st SET site_question = v.question
FROM service s, (VALUES
  ('ELECTRICITY_AGENCY', 'Dans quelle agence ?'),
  ('WATER_AGENCY', 'Dans quelle agence ?'),
  ('SANITATION_AGENCY', 'Dans quelle agence ?'),
  ('BANK_AGENCY', 'Dans quelle agence ?'),
  ('TELECOM_SHOP', 'Dans quelle boutique ?'),
  ('TV_SHOP', 'Dans quelle boutique ?'),
  ('POSTAL_COUNTER', 'Dans quel bureau de poste ?'),
  ('POLICE_PREMISES', 'Dans quel commissariat ou quelle brigade ?'),
  ('MOBILE_MONEY_AGENT', 'Dans quel point de service ?'),
  ('ATM_WITHDRAWAL', 'À quel distributeur ?')
) AS v (code, question)
WHERE s.code = v.code AND st.service_id = s.id AND st.language = 'fr';
