-- Removes the demonstration establishments of demo.sql (fixed ids d0000000-…).
-- Refused by the database if feedbacks were already given on them: they are
-- then kept on purpose. Territory and the CIVIL_REGISTRY service are kept.

BEGIN;
DELETE FROM establishment_service WHERE establishment_id::text LIKE 'd0000000-0000-4000-8000-%';
DELETE FROM establishment WHERE id::text LIKE 'd0000000-0000-4000-8000-%';
COMMIT;
