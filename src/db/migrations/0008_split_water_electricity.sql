-- "Eau et électricité" becomes two sectors, "Électricité" and "Eau", so that
-- Sen'Eau shows "Eau" and Senelec "Électricité" (decision of 2026-09-29).
-- The former UTILITIES sector keeps its id and becomes ELECTRICITY.

UPDATE sector SET code = 'ELECTRICITY' WHERE code = 'UTILITIES';

UPDATE translation SET text = 'Électricité'
WHERE target_table = 'sector' AND field = 'label' AND language = 'fr'
  AND target_id = (SELECT id FROM sector WHERE code = 'ELECTRICITY');

INSERT INTO sector (code) VALUES ('WATER');

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'sector', id, 'fr', 'Eau' FROM sector WHERE code = 'WATER';

-- Sen'Eau and its establishments move to the water sector.
UPDATE organization SET sector_id = (SELECT id FROM sector WHERE code = 'WATER')
WHERE code = 'SEN_EAU';

UPDATE establishment SET sector_id = (SELECT id FROM sector WHERE code = 'WATER')
WHERE organization_id = (SELECT id FROM organization WHERE code = 'SEN_EAU');
