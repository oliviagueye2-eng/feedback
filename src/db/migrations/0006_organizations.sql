-- First organisations (list validated on 2026-09-29) and, for each, its
-- establishment "in general" (scope = general). Their agencies will be added
-- organisation by organisation, from the lists they publish.
-- The establishment is named like the organisation; its aliases hold the full
-- name, acronyms and former names, so that each of them finds it.
-- Société Générale Sénégal: sale to the Senegalese State under way (2025-2026),
-- the name may change.

INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM (VALUES
  ('SENELEC', 'Senelec', 'Société nationale d''électricité du Sénégal', 'UTILITIES'),
  ('SEN_EAU', 'Sen''Eau', NULL, 'UTILITIES'),
  ('ORANGE', 'Orange', 'Sonatel (Société nationale des télécommunications du Sénégal)', 'TELECOM'),
  ('YAS', 'Yas', 'Yas Sénégal', 'TELECOM'),
  ('EXPRESSO', 'Expresso', 'Expresso Sénégal', 'TELECOM'),
  -- No postal sector: postal services go with telecoms (decision of 2026-09-29).
  ('LA_POSTE', 'La Poste', 'Société nationale La Poste', 'TELECOM'),
  ('IPRES', 'IPRES', 'Institution de prévoyance retraite du Sénégal', 'SOCIAL'),
  ('DGID', 'DGID', 'Direction générale des Impôts et des Domaines', 'TAX'),
  ('CBAO', 'CBAO', 'Compagnie bancaire de l''Afrique occidentale (groupe Attijariwafa bank)', 'BANKING_INSURANCE'),
  ('UBA', 'UBA', 'United Bank for Africa', 'BANKING_INSURANCE'),
  ('SOCIETE_GENERALE', 'Société Générale', 'Société Générale Sénégal', 'BANKING_INSURANCE')
) AS v (code, name, full_name, sector)
JOIN sector s ON s.code = v.sector;

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases::text[], o.id, 'general', o.sector_id
FROM (VALUES
  ('SENELEC', '{Société nationale d''électricité du Sénégal,électricité,Woyofal}'),
  ('SEN_EAU', '{Seneau,SDE,Sénégalaise des eaux,eau}'),
  ('ORANGE', '{Sonatel,Orange Sénégal,Orange Money}'),
  ('YAS', '{Free,Free Sénégal,Yas Sénégal,Mixx by Yas}'),
  ('EXPRESSO', '{Expresso Sénégal}'),
  ('LA_POSTE', '{Société nationale La Poste}'),
  ('IPRES', '{Institution de prévoyance retraite du Sénégal,retraite}'),
  ('DGID', '{Direction générale des Impôts et des Domaines,impôts,domaines}'),
  ('CBAO', '{Compagnie bancaire de l''Afrique occidentale,Attijariwafa bank}'),
  ('UBA', '{United Bank for Africa,UBA Sénégal}'),
  ('SOCIETE_GENERALE', '{Société Générale Sénégal,SGBS,SG}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;
