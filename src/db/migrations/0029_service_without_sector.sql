-- 0029: a service no longer has a sector (decided by Olivia, 2026-10-08).
-- A feedback takes the lists of its establishment's sector (its type's, else
-- its own), never its service's: establishment_service could link a place to
-- a service of another sector, and the two sectors could disagree. Nothing
-- reads service.sector_id any more. A service belongs to the establishments
-- that offer it (establishment_service).
ALTER TABLE service DROP COLUMN sector_id;
