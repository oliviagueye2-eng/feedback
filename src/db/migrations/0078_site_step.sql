-- 0078: « Dans quelle agence ? » (decided by Olivia, 2026-10-10). After a
-- service done in a place of the organisation, a feedback given to the
-- organisation « in general » asks which agency: one of its agencies, or a
-- new one typed by the user (pending review), or none (« Passer »).
-- service.asks_site says which services ask it: for now the four
-- « Une démarche en agence ».

ALTER TABLE service ADD COLUMN asks_site boolean NOT NULL DEFAULT false;

UPDATE service SET asks_site = true
WHERE code IN ('ELECTRICITY_AGENCY', 'WATER_AGENCY', 'SANITATION_AGENCY', 'BANK_AGENCY');
