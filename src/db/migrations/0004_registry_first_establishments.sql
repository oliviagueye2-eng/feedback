-- First establishments of the registry: 19 real public establishments
-- (hospitals, town halls, universities, identity documents, airport), entered
-- by hand on 2026-09-29. Names and municipalities checked on public sources;
-- the municipality is left empty when it could not be confirmed. The full
-- registry will be imported later from official sources.
-- Not included: Hôpital Aristide Le Dantec, closed for reconstruction
-- (reopening announced for April 2027).
-- Territory codes follow ISO 3166-2 (SN-DK…): the official territory import
-- must reuse them (or update these rows) rather than duplicate them.

-- ---------------------------------------------------------------------------
-- Territory (only what the establishments below need)
-- ---------------------------------------------------------------------------

INSERT INTO region (code, name) VALUES
  ('SN-DK', 'Dakar'), ('SN-TH', 'Thiès'), ('SN-SL', 'Saint-Louis');

INSERT INTO department (region_id, code, name)
SELECT r.id, v.code, v.name
FROM (VALUES
  ('SN-DK', 'SN-DK-DAKAR', 'Dakar'),
  ('SN-DK', 'SN-DK-GUEDIAWAYE', 'Guédiawaye'),
  ('SN-TH', 'SN-TH-THIES', 'Thiès'),
  ('SN-TH', 'SN-TH-MBOUR', 'Mbour'),
  ('SN-SL', 'SN-SL-SAINT-LOUIS', 'Saint-Louis')
) AS v (region, code, name)
JOIN region r ON r.code = v.region;

INSERT INTO municipality (department_id, code, name)
SELECT d.id, v.code, v.name
FROM (VALUES
  ('SN-DK-DAKAR', 'SN-DK-DAKAR-PLATEAU', 'Dakar-Plateau'),
  ('SN-DK-DAKAR', 'SN-DK-FANN', 'Fann-Point E-Amitié'),
  ('SN-DK-DAKAR', 'SN-DK-MEDINA', 'Médina'),
  ('SN-DK-DAKAR', 'SN-DK-GRAND-YOFF', 'Grand Yoff'),
  ('SN-DK-DAKAR', 'SN-DK-PARCELLES', 'Parcelles Assainies'),
  ('SN-TH-MBOUR', 'SN-TH-DIASS', 'Diass')
) AS v (department, code, name)
JOIN department d ON d.code = v.department;

-- ---------------------------------------------------------------------------
-- Civil registry, the service of the communes' town halls: searching "état
-- civil" or "extrait de naissance" lists them. Other services to be decided.
-- ---------------------------------------------------------------------------

INSERT INTO service (code, sector_id, synonyms)
SELECT 'CIVIL_REGISTRY', id,
       '{extrait de naissance,acte de naissance,déclaration de naissance,acte de mariage,acte de décès}'
FROM sector WHERE code = 'ADMINISTRATION';

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'service', id, 'fr', 'État civil' FROM service WHERE code = 'CIVIL_REGISTRY';

-- ---------------------------------------------------------------------------
-- Establishments. No establishment type yet (list not validated): the sector
-- is set directly.
-- ---------------------------------------------------------------------------

INSERT INTO establishment (name, aliases, sector_id, ownership, municipality_id)
SELECT v.name, v.aliases::text[], s.id, 'public', m.id
FROM (VALUES
  -- Health
  ('Hôpital Principal de Dakar',
   '{Principal,Hôpital Principal}', 'HEALTH', 'SN-DK-DAKAR-PLATEAU'),
  ('Centre hospitalier national universitaire de Fann',
   '{Hôpital Fann,CHNU de Fann}', 'HEALTH', 'SN-DK-FANN'),
  ('Centre hospitalier national d''enfants Albert Royer',
   '{Hôpital Albert Royer,Albert Royer,hôpital d''enfants}', 'HEALTH', 'SN-DK-FANN'),
  ('Hôpital Général Idrissa Pouye',
   '{HOGIP,HOGGY,Hôpital général de Grand-Yoff,CTO}', 'HEALTH', 'SN-DK-GRAND-YOFF'),
  ('Centre hospitalier Abass Ndao',
   '{Hôpital Abass Ndao,Abass Ndao}', 'HEALTH', NULL),
  ('Centre hospitalier national Dalal Jamm',
   '{Hôpital Dalal Jamm,Dalal Jamm}', 'HEALTH', NULL),
  ('Centre hospitalier Roi Baudouin de Guédiawaye',
   '{Hôpital Roi Baudouin,Roi Baudouin}', 'HEALTH', NULL),
  ('Hôpital régional El Hadji Amadou Sakhir Ndiéguène',
   '{Hôpital régional de Thiès}', 'HEALTH', NULL),
  -- Town halls
  ('Mairie de la Ville de Dakar',
   '{Hôtel de ville de Dakar,Ville de Dakar}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  ('Mairie de Dakar-Plateau',
   '{mairie du Plateau}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  ('Mairie de Grand Yoff',
   '{}', 'ADMINISTRATION', 'SN-DK-GRAND-YOFF'),
  ('Mairie des Parcelles Assainies',
   '{mairie des Parcelles}', 'ADMINISTRATION', 'SN-DK-PARCELLES'),
  ('Mairie de la Médina',
   '{}', 'ADMINISTRATION', 'SN-DK-MEDINA'),
  ('Mairie de la Ville de Thiès',
   '{Hôtel de ville de Thiès}', 'ADMINISTRATION', NULL),
  -- Identity documents
  ('Direction de l''Automatisation des Fichiers',
   '{DAF,carte d''identité}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  -- Education
  ('Université Cheikh Anta Diop de Dakar',
   '{UCAD,Université de Dakar}', 'EDUCATION', 'SN-DK-FANN'),
  ('Université Gaston Berger de Saint-Louis',
   '{UGB,Université de Saint-Louis}', 'EDUCATION', NULL),
  ('Lycée Lamine Guèye',
   '{}', 'EDUCATION', 'SN-DK-DAKAR-PLATEAU'),
  -- Transport
  ('Aéroport international Blaise Diagne',
   '{AIBD,aéroport de Dakar,aéroport de Diass}', 'TRANSPORT', 'SN-TH-DIASS')
) AS v (name, aliases, sector, municipality)
JOIN sector s ON s.code = v.sector
LEFT JOIN municipality m ON m.code = v.municipality;

-- The communes' town halls keep the civil registry.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e, service s
WHERE s.code = 'CIVIL_REGISTRY'
  AND e.name IN ('Mairie de Dakar-Plateau', 'Mairie de Grand Yoff',
                 'Mairie des Parcelles Assainies', 'Mairie de la Médina');
