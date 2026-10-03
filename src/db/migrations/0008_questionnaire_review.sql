-- Review of the questionnaire (docs/analyse-questionnaire.md, 2026-10-03).

-- The driving licence and registration centre is a service with a file, not
-- transport: it was offered « Sécurité à bord » and « État des véhicules » but
-- not « Délai de traitement du dossier » (validated on 2026-10-03). Its
-- questions do not change: the Administration list is FILE_SERVICES, the
-- list it already had.
UPDATE establishment_type
SET sector_id = (SELECT id FROM sector WHERE code = 'ADMINISTRATION')
WHERE code = 'DRIVING_LICENCE_CENTER';
