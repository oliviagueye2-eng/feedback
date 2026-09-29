-- DEMONSTRATION DATA — not an official registry.
-- Real establishments, entered by hand on 2026-09-29 so that the search can be
-- tried online. Names and municipalities checked on public sources; a
-- municipality is left empty when it could not be confirmed. Not a migration:
-- run it once, by hand, after the migrations (see README). Safe to run twice.
-- To remove it: src/db/seeds/demo-remove.sql.
-- Left out on purpose: Hôpital Aristide Le Dantec, closed for reconstruction
-- (reopening announced for April 2027).

BEGIN;

-- ---------------------------------------------------------------------------
-- Territory (only what the establishments below need)
-- ---------------------------------------------------------------------------

INSERT INTO region (code, name) VALUES
  ('SN-DK', 'Dakar'), ('SN-TH', 'Thiès'), ('SN-SL', 'Saint-Louis')
ON CONFLICT (code) DO NOTHING;

INSERT INTO department (region_id, code, name)
SELECT r.id, v.code, v.name
FROM (VALUES
  ('SN-DK', 'SN-DK-DAKAR', 'Dakar'),
  ('SN-DK', 'SN-DK-GUEDIAWAYE', 'Guédiawaye'),
  ('SN-TH', 'SN-TH-THIES', 'Thiès'),
  ('SN-TH', 'SN-TH-MBOUR', 'Mbour'),
  ('SN-SL', 'SN-SL-SAINT-LOUIS', 'Saint-Louis')
) AS v (region, code, name)
JOIN region r ON r.code = v.region
ON CONFLICT (code) DO NOTHING;

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
JOIN department d ON d.code = v.department
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- One service, so that searching "état civil" or "extrait de naissance"
-- lists the town halls. The real list of services is still to be decided.
-- ---------------------------------------------------------------------------

INSERT INTO service (code, sector_id, synonyms)
SELECT 'CIVIL_REGISTRY', id,
       '{extrait de naissance,acte de naissance,déclaration de naissance,acte de mariage,acte de décès}'
FROM sector WHERE code = 'ADMINISTRATION'
ON CONFLICT (code) DO NOTHING;

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'service', id, 'fr', 'État civil' FROM service WHERE code = 'CIVIL_REGISTRY'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Establishments. Fixed ids (d0000000-…) so that they can be removed cleanly.
-- No establishment type yet (list not validated): the sector is set directly.
-- ---------------------------------------------------------------------------

INSERT INTO establishment (id, name, aliases, sector_id, ownership, municipality_id)
SELECT v.id::uuid, v.name, v.aliases::text[], s.id, 'public', m.id
FROM (VALUES
  -- Health
  ('d0000000-0000-4000-8000-000000000001', 'Hôpital Principal de Dakar',
   '{Principal,Hôpital Principal}', 'HEALTH', 'SN-DK-DAKAR-PLATEAU'),
  ('d0000000-0000-4000-8000-000000000002', 'Centre hospitalier national universitaire de Fann',
   '{Hôpital Fann,CHNU de Fann}', 'HEALTH', 'SN-DK-FANN'),
  ('d0000000-0000-4000-8000-000000000003', 'Centre hospitalier national d''enfants Albert Royer',
   '{Hôpital Albert Royer,Albert Royer,hôpital d''enfants}', 'HEALTH', 'SN-DK-FANN'),
  ('d0000000-0000-4000-8000-000000000004', 'Hôpital Général Idrissa Pouye',
   '{HOGIP,HOGGY,Hôpital général de Grand-Yoff,CTO}', 'HEALTH', 'SN-DK-GRAND-YOFF'),
  ('d0000000-0000-4000-8000-000000000005', 'Centre hospitalier Abass Ndao',
   '{Hôpital Abass Ndao,Abass Ndao}', 'HEALTH', NULL),
  ('d0000000-0000-4000-8000-000000000006', 'Centre hospitalier national Dalal Jamm',
   '{Hôpital Dalal Jamm,Dalal Jamm}', 'HEALTH', NULL),
  ('d0000000-0000-4000-8000-000000000007', 'Centre hospitalier Roi Baudouin de Guédiawaye',
   '{Hôpital Roi Baudouin,Roi Baudouin}', 'HEALTH', NULL),
  ('d0000000-0000-4000-8000-000000000008', 'Hôpital régional El Hadji Amadou Sakhir Ndiéguène',
   '{Hôpital régional de Thiès}', 'HEALTH', NULL),
  -- Town halls
  ('d0000000-0000-4000-8000-000000000011', 'Mairie de la Ville de Dakar',
   '{Hôtel de ville de Dakar,Ville de Dakar}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  ('d0000000-0000-4000-8000-000000000012', 'Mairie de Dakar-Plateau',
   '{mairie du Plateau}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  ('d0000000-0000-4000-8000-000000000013', 'Mairie de Grand Yoff',
   '{}', 'ADMINISTRATION', 'SN-DK-GRAND-YOFF'),
  ('d0000000-0000-4000-8000-000000000014', 'Mairie des Parcelles Assainies',
   '{mairie des Parcelles}', 'ADMINISTRATION', 'SN-DK-PARCELLES'),
  ('d0000000-0000-4000-8000-000000000015', 'Mairie de la Médina',
   '{}', 'ADMINISTRATION', 'SN-DK-MEDINA'),
  ('d0000000-0000-4000-8000-000000000016', 'Mairie de la Ville de Thiès',
   '{Hôtel de ville de Thiès}', 'ADMINISTRATION', NULL),
  -- Identity documents
  ('d0000000-0000-4000-8000-000000000021', 'Direction de l''Automatisation des Fichiers',
   '{DAF,carte d''identité}', 'ADMINISTRATION', 'SN-DK-DAKAR-PLATEAU'),
  -- Education
  ('d0000000-0000-4000-8000-000000000031', 'Université Cheikh Anta Diop de Dakar',
   '{UCAD,Université de Dakar}', 'EDUCATION', 'SN-DK-FANN'),
  ('d0000000-0000-4000-8000-000000000032', 'Université Gaston Berger de Saint-Louis',
   '{UGB,Université de Saint-Louis}', 'EDUCATION', NULL),
  ('d0000000-0000-4000-8000-000000000033', 'Lycée Lamine Guèye',
   '{}', 'EDUCATION', 'SN-DK-DAKAR-PLATEAU'),
  -- Transport
  ('d0000000-0000-4000-8000-000000000041', 'Aéroport international Blaise Diagne',
   '{AIBD,aéroport de Dakar,aéroport de Diass}', 'TRANSPORT', 'SN-TH-DIASS')
) AS v (id, name, aliases, sector, municipality)
JOIN sector s ON s.code = v.sector
LEFT JOIN municipality m ON m.code = v.municipality
ON CONFLICT (id) DO NOTHING;

-- Town halls of communes keep the civil registry.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id::uuid, s.id
FROM (VALUES
  ('d0000000-0000-4000-8000-000000000012'),
  ('d0000000-0000-4000-8000-000000000013'),
  ('d0000000-0000-4000-8000-000000000014'),
  ('d0000000-0000-4000-8000-000000000015')
) AS e (id)
CROSS JOIN service s
WHERE s.code = 'CIVIL_REGISTRY'
ON CONFLICT DO NOTHING;

COMMIT;
