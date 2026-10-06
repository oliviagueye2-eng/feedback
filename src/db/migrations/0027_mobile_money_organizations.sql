-- 0027: Orange Money and Mixx by Yas become organisations of their own
-- (decided by Olivia on 2026-10-06), in Banking and insurance next to Wave.
-- A user thinks « Orange Money », not « Orange »; and the public results then
-- compare the three mobile money operators with each other, instead of mixing
-- the telephone network with money transfers in the rating of Orange or Yas.
-- Orange Money is run by a subsidiary of Sonatel, Orange Finances Mobiles
-- Sénégal; Mixx by Yas is left without a full name, not
-- checked. Orange and Yas keep only « Téléphone ou internet ». No feedback
-- to move: the site is not launched yet.

INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM (VALUES
  ('ORANGE_MONEY', 'Orange Money', 'Orange Finances Mobiles Sénégal'),
  ('MIXX_BY_YAS', 'Mixx by Yas', NULL)
) AS v (code, name, full_name)
JOIN sector s ON s.code = 'BANKING_INSURANCE';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases::text[], o.id, 'general', o.sector_id
FROM (VALUES
  ('ORANGE_MONEY', '{OM,Orange Finances Mobiles,OFMS,mobile money,transfert d''argent}'),
  ('MIXX_BY_YAS', '{Mixx,Yas Money,mobile money,transfert d''argent}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;

-- The mobile money services move from the operators to the new organisations.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN organization o ON o.id = e.organization_id AND o.code IN ('ORANGE_MONEY', 'MIXX_BY_YAS')
JOIN service s ON s.code IN ('MOBILE_MONEY', 'MOBILE_MONEY_AGENT', 'MOBILE_MONEY_SUPPORT')
WHERE e.scope = 'general';

DELETE FROM establishment_service es
USING establishment e, organization o, service s
WHERE e.id = es.establishment_id AND o.id = e.organization_id AND s.id = es.service_id
  AND o.code IN ('ORANGE', 'YAS')
  AND s.code IN ('MOBILE_MONEY', 'MOBILE_MONEY_AGENT', 'MOBILE_MONEY_SUPPORT');

-- The brand names leave the operators' aliases.
UPDATE establishment e
SET aliases = array_remove(array_remove(e.aliases, 'Orange Money'), 'Mixx by Yas')
FROM organization o
WHERE o.id = e.organization_id AND o.code IN ('ORANGE', 'YAS');
