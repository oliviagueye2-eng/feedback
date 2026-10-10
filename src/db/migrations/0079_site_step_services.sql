-- 0079: « Dans quelle agence ? » also after the services done in a shop, at a
-- counter, in the premises, at a service point or at a cash machine (decided
-- by Olivia, 2026-10-10). A new file: 0078 may already be applied.

UPDATE service SET asks_site = true
WHERE code IN ('TELECOM_SHOP', 'TV_SHOP', 'POSTAL_COUNTER', 'POLICE_PREMISES',
               'MOBILE_MONEY_AGENT', 'ATM_WITHDRAWAL');
