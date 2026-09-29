-- Sector of an establishment whose type is unknown, mainly one typed by a user
-- on screen 0c ("Je ne trouve pas mon établissement", sector optional).
-- Registry establishments get their sector from their type.
-- Where both exist, the type's sector wins.
ALTER TABLE establishment ADD COLUMN sector_id smallint REFERENCES sector (id);
