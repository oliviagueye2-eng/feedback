-- Tourism sector: travel agencies, tour guides, tourist sites, tourist
-- information offices. Accommodation stays in HOSPITALITY, museums in CULTURE.

INSERT INTO sector (code) VALUES ('TOURISM');

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'sector', id, 'fr', 'Tourisme' FROM sector WHERE code = 'TOURISM';
