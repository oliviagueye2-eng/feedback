-- 0073: the paths (services) of a type (decided by Olivia, 2026-10-09,
-- /mnt/project-files/questionnaire/proposition-types-parcours.md). Every
-- establishment of a type offers the type's services, one added later too; an
-- establishment can still offer services of its own (establishment_service,
-- e.g. the civil registry at some town halls). What an establishment offers
-- is the view establishment_offer.
-- Every establishment gets a type: nineteen new types, mostly an organisation
-- taken as a whole (« Ecobank », « Orange »), and existing types for the shops,
-- the tax offices and social security. Each establishment keeps exactly the
-- services it had.

CREATE TABLE establishment_type_service (
  type_id integer NOT NULL REFERENCES establishment_type (id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES service (id),
  PRIMARY KEY (type_id, service_id)
);

CREATE VIEW establishment_offer (establishment_id, service_id) AS
  SELECT establishment_id, service_id FROM establishment_service
  UNION
  SELECT e.id, ts.service_id FROM establishment e JOIN establishment_type_service ts ON ts.type_id = e.type_id;

-- ---------------------------------------------------------------------------
-- The new types
-- ---------------------------------------------------------------------------
INSERT INTO establishment_type (code, sector_id)
SELECT v.code, s.id
FROM (VALUES
  ('BANK', 'BANKING_INSURANCE'), ('INSURER', 'BANKING_INSURANCE'),
  ('WATER_UTILITY', 'WATER'), ('SANITATION_UTILITY', 'WATER'),
  ('ELECTRICITY_UTILITY', 'ELECTRICITY'),
  ('MOBILE_OPERATOR', 'TELECOM'), ('TV_OPERATOR', 'TELECOM'),
  ('MOBILE_MONEY_PROVIDER', 'MOBILE_PAYMENT'),
  ('POSTAL_OPERATOR', 'DELIVERY'),
  ('NATIONAL_SECURITY_FORCE', 'SECURITY'),
  ('BUS_NETWORK', 'TRANSPORT'), ('TRAIN', 'TRANSPORT'), ('AIRLINE', 'TRANSPORT'), ('FERRY', 'TRANSPORT'),
  ('RIDE_HAILING_APP', 'TRANSPORT'), ('TAXI', 'TRANSPORT'), ('TOLL_ROAD', 'TRANSPORT'), ('PORT', 'TRANSPORT'),
  ('GAMING', 'RETAIL')
) AS v (code, sector)
JOIN sector s ON s.code = v.sector;

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT et.id, 'fr', v.label
FROM (VALUES
  ('BANK', 'Banque'), ('INSURER', 'Compagnie d''assurance'),
  ('WATER_UTILITY', 'Distribution d''eau'), ('SANITATION_UTILITY', 'Assainissement'),
  ('ELECTRICITY_UTILITY', 'Fournisseur d''électricité'),
  ('MOBILE_OPERATOR', 'Opérateur téléphone et internet'), ('TV_OPERATOR', 'Opérateur de télévision'),
  ('MOBILE_MONEY_PROVIDER', 'Service de paiement mobile'),
  ('POSTAL_OPERATOR', 'Poste'),
  ('NATIONAL_SECURITY_FORCE', 'Police ou gendarmerie nationale'),
  ('BUS_NETWORK', 'Réseau de bus'), ('TRAIN', 'Train'), ('AIRLINE', 'Compagnie aérienne'),
  ('FERRY', 'Liaison maritime'), ('RIDE_HAILING_APP', 'Application de VTC'), ('TAXI', 'Taxis'),
  ('TOLL_ROAD', 'Autoroute à péage'), ('PORT', 'Port'),
  ('GAMING', 'Jeux et paris')
) AS v (code, label)
JOIN establishment_type et ON et.code = v.code;

-- ---------------------------------------------------------------------------
-- A type for every establishment
-- ---------------------------------------------------------------------------
UPDATE establishment e SET type_id = et.id
FROM organization o, establishment_type et,
     (VALUES
       ('SEN_EAU', 'WATER_UTILITY'), ('ONAS', 'SANITATION_UTILITY'), ('SENELEC', 'ELECTRICITY_UTILITY'),
       ('ORANGE', 'MOBILE_OPERATOR'), ('YAS', 'MOBILE_OPERATOR'), ('EXPRESSO', 'MOBILE_OPERATOR'),
       ('CANAL_PLUS', 'TV_OPERATOR'), ('STARTIMES', 'TV_OPERATOR'),
       ('WAVE', 'MOBILE_MONEY_PROVIDER'), ('ORANGE_MONEY', 'MOBILE_MONEY_PROVIDER'),
       ('MIXX_BY_YAS', 'MOBILE_MONEY_PROVIDER'),
       ('LA_POSTE', 'POSTAL_OPERATOR'),
       ('POLICE_NATIONALE', 'NATIONAL_SECURITY_FORCE'), ('GENDARMERIE_NATIONALE', 'NATIONAL_SECURITY_FORCE'),
       ('AFTU', 'BUS_NETWORK'), ('BRT', 'BUS_NETWORK'), ('DEM_DIKK', 'BUS_NETWORK'), ('TER', 'TRAIN'),
       ('AIR_SENEGAL', 'AIRLINE'), ('COSAMA', 'FERRY'), ('HEETCH', 'RIDE_HAILING_APP'),
       ('YANGO', 'RIDE_HAILING_APP'), ('STREET_TAXI', 'TAXI'), ('TOLL_HIGHWAY', 'TOLL_ROAD'),
       ('PORT_DAKAR', 'PORT'),
       ('LONASE', 'GAMING'), ('AUCHAN', 'SUPERMARKET'), ('CARREFOUR', 'SUPERMARKET'),
       ('EDK', 'FUEL_STATION'), ('ELTON', 'FUEL_STATION'), ('ORYX', 'FUEL_STATION'), ('SHELL', 'FUEL_STATION'),
       ('STAR_OIL', 'FUEL_STATION'), ('TOTALENERGIES', 'FUEL_STATION'),
       ('ANACMU', 'SOCIAL_SECURITY_OFFICE'), ('CSS', 'SOCIAL_SECURITY_OFFICE'), ('IPRES', 'SOCIAL_SECURITY_OFFICE'),
       ('DGID', 'TAX_OFFICE'), ('DOUANES', 'CUSTOMS_OFFICE'), ('TRESOR', 'TREASURY_OFFICE')
     ) AS v (organization, type)
WHERE e.type_id IS NULL AND o.id = e.organization_id AND o.code = v.organization AND et.code = v.type;

-- Banks and insurers: by what they offer.
UPDATE establishment e
SET type_id = (SELECT id FROM establishment_type
               WHERE code = CASE WHEN EXISTS (SELECT 1 FROM establishment_service es JOIN service s ON s.id = es.service_id
                                              WHERE es.establishment_id = e.id AND s.code = 'INSURANCE_CLAIM')
                                 THEN 'INSURER' ELSE 'BANK' END)
WHERE e.type_id IS NULL AND e.sector_id = (SELECT id FROM sector WHERE code = 'BANKING_INSURANCE');

-- ---------------------------------------------------------------------------
-- The services of each type
-- ---------------------------------------------------------------------------
-- The new types: those their establishments offer (the same at each).
INSERT INTO establishment_type_service (type_id, service_id)
SELECT DISTINCT e.type_id, es.service_id
FROM establishment e
JOIN establishment_type et ON et.id = e.type_id
JOIN establishment_service es ON es.establishment_id = e.id
WHERE et.code IN ('BANK', 'INSURER', 'WATER_UTILITY', 'SANITATION_UTILITY', 'ELECTRICITY_UTILITY',
                  'MOBILE_OPERATOR', 'TV_OPERATOR', 'MOBILE_MONEY_PROVIDER', 'POSTAL_OPERATOR',
                  'NATIONAL_SECURITY_FORCE', 'BUS_NETWORK', 'TRAIN', 'AIRLINE', 'FERRY', 'RIDE_HAILING_APP',
                  'TAXI', 'TOLL_ROAD', 'PORT');

-- The schools and the health places (validation-education.md, validation-sante.md).
INSERT INTO establishment_type_service (type_id, service_id)
SELECT et.id, s.id
FROM (VALUES
  ('PRIMARY_SCHOOL', 'SCHOOL_ADMIN'), ('PRIMARY_SCHOOL', 'SCHOOL_LIFE'),
  ('MIDDLE_SCHOOL', 'SCHOOL_ADMIN'), ('MIDDLE_SCHOOL', 'SCHOOL_LIFE'),
  ('HIGH_SCHOOL', 'SCHOOL_ADMIN'), ('HIGH_SCHOOL', 'SCHOOL_LIFE'),
  ('SCHOOL_GROUP', 'SCHOOL_ADMIN'), ('SCHOOL_GROUP', 'SCHOOL_LIFE'),
  ('UNIVERSITY', 'HIGHER_EDUCATION_ADMIN'), ('UNIVERSITY', 'HIGHER_EDUCATION_COURSES'),
  ('HIGHER_EDUCATION_SCHOOL', 'HIGHER_EDUCATION_ADMIN'), ('HIGHER_EDUCATION_SCHOOL', 'HIGHER_EDUCATION_COURSES'),
  ('VOCATIONAL_TRAINING_CENTER', 'HIGHER_EDUCATION_ADMIN'), ('VOCATIONAL_TRAINING_CENTER', 'HIGHER_EDUCATION_COURSES'),
  ('HOSPITAL', 'EMERGENCY'), ('HOSPITAL', 'CONSULTATION'), ('HOSPITAL', 'HOSPITAL_STAY'), ('HOSPITAL', 'MATERNITY'),
  ('CLINIC', 'EMERGENCY'), ('CLINIC', 'CONSULTATION'), ('CLINIC', 'HOSPITAL_STAY'), ('CLINIC', 'MATERNITY'),
  ('HEALTH_CENTER', 'MATERNITY')
) AS v (type, service)
JOIN establishment_type et ON et.code = v.type
JOIN service s ON s.code = v.service;

-- An establishment keeps as its own only what its type does not offer.
DELETE FROM establishment_service es
USING establishment e, establishment_type_service ts
WHERE e.id = es.establishment_id AND ts.type_id = e.type_id AND ts.service_id = es.service_id;
