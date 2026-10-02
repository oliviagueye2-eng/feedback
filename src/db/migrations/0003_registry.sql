-- Registry entered by hand (rewritten on 2026-10-02): territory, establishment
-- types, services, organisations and establishments, all real and checked on
-- public sources. The full registry will be imported later from official
-- sources. Territory codes follow ISO 3166-2 (SN-DK…): the official territory
-- import must reuse them (or update these rows) rather than duplicate them.

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
-- Establishment types (the full list is not validated yet)
-- ---------------------------------------------------------------------------

INSERT INTO establishment_type (code, sector_id)
SELECT 'AIRPORT', id FROM sector WHERE code = 'TRANSPORT';

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT id, 'fr', 'Aéroport' FROM establishment_type WHERE code = 'AIRPORT';

-- ---------------------------------------------------------------------------
-- Services: what the user came to do. « Autre démarche » is offered on screen 1
-- for every establishment that has services.
-- ---------------------------------------------------------------------------

INSERT INTO service (code, sector_id, synonyms)
SELECT v.code, s.id, v.synonyms::text[]
FROM (VALUES
  -- The civil registry of the communes' town halls: searching « état civil »
  -- or « extrait de naissance » lists them.
  ('CIVIL_REGISTRY', 'ADMINISTRATION',
   '{extrait de naissance,acte de naissance,déclaration de naissance,acte de mariage,acte de décès}'),
  -- Transport (2026-10-02): one service per mode, plus the ticket purchase.
  ('LAND_TRIP', 'TRANSPORT', '{trajet,voyage,bus,train}'),
  ('BOAT_CROSSING', 'TRANSPORT', '{traversée,bateau,ferry,voyage}'),
  ('TICKET_PURCHASE', 'TRANSPORT', '{ticket,billet,abonnement,carte}')
) AS v (code, sector, synonyms)
JOIN sector s ON s.code = v.sector;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('CIVIL_REGISTRY', 'État civil'),
  ('LAND_TRIP', 'Un trajet en bus ou en train'),
  ('BOAT_CROSSING', 'Une traversée en bateau'),
  ('TICKET_PURCHASE', 'Achat d''un ticket ou d''une carte d''abonnement')
) AS v (code, label)
JOIN service s ON s.code = v.code;

-- ---------------------------------------------------------------------------
-- Organisations (lists validated on 2026-09-29 and 2026-10-02), each with its
-- establishment « in general », named like the organisation; its aliases hold
-- the full name, acronyms and former names, so that each of them finds it.
-- Their agencies, lines and stations will be added organisation by
-- organisation, from the lists they publish.
-- Société Générale Sénégal: sale to the Senegalese State under way, the name
-- may change. Dem Dikk: Dakar Dem Dikk renamed Dem Dikk S.A. on 2026-09-11.
-- ---------------------------------------------------------------------------

INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM (VALUES
  ('SENELEC', 'Senelec', 'Société nationale d''électricité du Sénégal', 'ELECTRICITY'),
  ('SEN_EAU', 'Sen''Eau', NULL, 'WATER'),
  ('ORANGE', 'Orange', 'Sonatel (Société nationale des télécommunications du Sénégal)', 'TELECOM'),
  ('YAS', 'Yas', 'Yas Sénégal', 'TELECOM'),
  ('EXPRESSO', 'Expresso', 'Expresso Sénégal', 'TELECOM'),
  ('LA_POSTE', 'La Poste', 'Société nationale La Poste', 'TELECOM'),
  ('IPRES', 'IPRES', 'Institution de prévoyance retraite du Sénégal', 'SOCIAL'),
  ('DGID', 'DGID', 'Direction générale des Impôts et des Domaines', 'TAX'),
  ('CBAO', 'CBAO', 'Compagnie bancaire de l''Afrique occidentale (groupe Attijariwafa bank)', 'BANKING_INSURANCE'),
  ('UBA', 'UBA', 'United Bank for Africa', 'BANKING_INSURANCE'),
  ('SOCIETE_GENERALE', 'Société Générale', 'Société Générale Sénégal', 'BANKING_INSURANCE'),
  ('DEM_DIKK', 'Dem Dikk', 'Dem Dikk S.A. (anciennement Dakar Dem Dikk)', 'TRANSPORT'),
  ('BRT', 'BRT', 'Bus Rapid Transit de Dakar, exploité par Dakar Mobilité', 'TRANSPORT'),
  ('TER', 'TER', 'Train express régional de Dakar, exploité par la SETER', 'TRANSPORT'),
  ('AFTU', 'AFTU', 'Association de financement des professionnels du transport urbain', 'TRANSPORT'),
  ('COSAMA', 'COSAMA', 'Consortium sénégalais d''activités maritimes', 'TRANSPORT')
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
  ('SOCIETE_GENERALE', '{Société Générale Sénégal,SGBS,SG}'),
  ('DEM_DIKK', '{Dakar Dem Dikk,DDD,Dem Dikk S.A.}'),
  ('BRT', '{Dakar Mobilité,Sunu BRT,Bus Rapid Transit}'),
  ('TER', '{SETER,SENTER,Train express régional}'),
  ('AFTU', '{Tata,minibus Tata,bus Tata}'),
  ('COSAMA', '{Consortium sénégalais d''activités maritimes,bateau,ferry,liaison maritime}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;

-- ---------------------------------------------------------------------------
-- Places: 19 public establishments entered on 2026-09-29 (the municipality is
-- left empty when it could not be confirmed; Hôpital Aristide Le Dantec is not
-- included, closed for reconstruction until April 2027), and the COSAMA ship
-- (private operator with a public service mission).
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

UPDATE establishment
SET type_id = (SELECT id FROM establishment_type WHERE code = 'AIRPORT')
WHERE name = 'Aéroport international Blaise Diagne';

-- The ship Aline Sitoë Diatta, COSAMA's site on the Dakar – Ziguinchor line
-- (the Diambogne and the Aguène are not added, as decided).
INSERT INTO establishment (name, aliases, organization_id, scope, sector_id, ownership)
SELECT 'Aline Sitoë Diatta (bateau Dakar – Ziguinchor)',
       '{bateau Dakar Ziguinchor,Aline Sitoe Diatta,ferry Ziguinchor}',
       o.id, 'site', o.sector_id, 'private'
FROM organization o WHERE o.code = 'COSAMA';

-- ---------------------------------------------------------------------------
-- Which establishments offer which service
-- ---------------------------------------------------------------------------

-- The communes' town halls keep the civil registry.
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e, service s
WHERE s.code = 'CIVIL_REGISTRY'
  AND e.name IN ('Mairie de Dakar-Plateau', 'Mairie de Grand Yoff',
                 'Mairie des Parcelles Assainies', 'Mairie de la Médina');

-- The transport operators' establishments (« in general » and sites).
INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM (VALUES
  ('LAND_TRIP', 'DEM_DIKK'), ('LAND_TRIP', 'BRT'), ('LAND_TRIP', 'TER'), ('LAND_TRIP', 'AFTU'),
  ('BOAT_CROSSING', 'COSAMA'),
  ('TICKET_PURCHASE', 'DEM_DIKK'), ('TICKET_PURCHASE', 'BRT'), ('TICKET_PURCHASE', 'TER'),
  ('TICKET_PURCHASE', 'AFTU'), ('TICKET_PURCHASE', 'COSAMA')
) AS v (service, organization)
JOIN service s ON s.code = v.service
JOIN organization o ON o.code = v.organization
JOIN establishment e ON e.organization_id = o.id;
