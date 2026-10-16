-- 0083: real estate (decided by Olivia, 2026-10-15). The sector had no
-- establishment at all: someone who wanted to speak of the cost of rents found
-- nothing. One generic establishment, rated « in general » like the street
-- taxis (0017): a landlord, an agency or a broker is mostly a private person,
-- not a place to list. Its organisation has no operator; nobody receives its
-- results yet, they are published like the others. Three services (their
-- topics and questions in 0084):
--   PROPERTY_SALE « Achat ou vente d'un bien immobilier »;
--   PROPERTY_RENTAL « Louer un logement (locataire) »;
--   PROPERTY_LETTING « Mettre un bien en location (propriétaire) ».

INSERT INTO organization (code, name, full_name, sector_id)
SELECT 'REAL_ESTATE', 'Immobilier (achat, vente, location)', NULL, id FROM sector WHERE code = 'REAL_ESTATE';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, '{immobilier,logement,agence immobilière,propriétaire,bailleur,courtier,démarcheur}', o.id, 'general',
       o.sector_id
FROM organization o
WHERE o.code = 'REAL_ESTATE';

INSERT INTO service (code, synonyms) VALUES
  ('PROPERTY_SALE',
   '{achat,vente,acheter,vendre,maison,appartement,terrain,parcelle,villa,titre foncier,notaire,promoteur}'),
  ('PROPERTY_RENTAL',
   '{location,louer,loyer,loyers,bail,caution,avance,commission,locataire,maison,appartement,chambre,studio}'),
  ('PROPERTY_LETTING',
   '{mise en location,mettre en location,propriétaire,bailleur,loyer,loyers,impayé,impayés,gestion locative,locataire}');

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_SALE', 'Achat ou vente d''un bien immobilier'),
  ('PROPERTY_RENTAL', 'Louer un logement (locataire)'),
  ('PROPERTY_LETTING', 'Mettre un bien en location (propriétaire)')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e, service s
WHERE e.organization_id = (SELECT id FROM organization WHERE code = 'REAL_ESTATE')
  AND s.code IN ('PROPERTY_SALE', 'PROPERTY_RENTAL', 'PROPERTY_LETTING');
