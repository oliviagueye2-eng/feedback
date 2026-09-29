-- Organisations with several establishments (Senelec, Sen'Eau, La Poste,
-- operators, social security funds...). An organisation can be rated at one
-- of its places (an agency, scope = site) or "in general" (scope = general:
-- power cuts, bills, customer service...), which is not tied to any place.
-- Every feedback stays attached to an establishment: the "in general" one is
-- a special establishment of the organisation, without address or municipality.
-- Published overall score of an organisation: all feedbacks of all its
-- establishments together, with the detail per establishment.

CREATE TABLE organization (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      text NOT NULL UNIQUE,
  name      text NOT NULL,
  sector_id smallint NOT NULL REFERENCES sector (id)
);

ALTER TABLE establishment
  ADD COLUMN organization_id smallint REFERENCES organization (id),
  ADD COLUMN scope text NOT NULL DEFAULT 'site' CHECK (scope IN ('site', 'general')),
  -- "In general" belongs to an organisation and is nowhere in particular.
  ADD CONSTRAINT establishment_general_check CHECK (
    scope = 'site'
    OR (organization_id IS NOT NULL AND municipality_id IS NULL AND address IS NULL)
  );

-- At most one "in general" establishment per organisation.
CREATE UNIQUE INDEX establishment_one_general_per_organization
  ON establishment (organization_id) WHERE scope = 'general';
CREATE INDEX establishment_organization_idx ON establishment (organization_id);

-- A QR code is displayed in a place: never on an "in general" establishment.
CREATE FUNCTION qr_code_site_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT scope FROM establishment WHERE id = NEW.establishment_id) = 'general' THEN
    RAISE EXCEPTION 'A QR code cannot point to an "in general" establishment'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'qr_code_site_only';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER qr_code_site_only
  BEFORE INSERT OR UPDATE OF establishment_id ON qr_code
  FOR EACH ROW EXECUTE FUNCTION qr_code_site_only();

CREATE FUNCTION establishment_general_without_qr_code() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM qr_code WHERE establishment_id = NEW.id) THEN
    RAISE EXCEPTION 'An establishment with QR codes cannot become "in general"'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'qr_code_site_only';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER establishment_general_without_qr_code
  BEFORE UPDATE OF scope ON establishment
  FOR EACH ROW WHEN (NEW.scope = 'general')
  EXECUTE FUNCTION establishment_general_without_qr_code();
