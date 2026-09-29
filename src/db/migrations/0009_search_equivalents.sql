-- Expressions that mean the same thing to users: "hôtel de ville" is searched
-- as "mairie", in stored names and in queries alike, so that "hotel de ville
-- medina" finds the Mairie de la Médina, and any town hall added later.
-- Must match SEARCH_EQUIVALENTS in src/lib/text.ts.

CREATE OR REPLACE FUNCTION search_terms(input text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      regexp_replace(normalize_search(input), '\mhotel de ville\M', 'mairie', 'g'),
      '\m(senegal)\M', ' ', 'g'),
    ' +', ' ', 'g'))
$$;

-- Recompute the stored values (the triggers fire on these columns).
UPDATE establishment SET aliases = aliases;
UPDATE service SET synonyms = synonyms;
