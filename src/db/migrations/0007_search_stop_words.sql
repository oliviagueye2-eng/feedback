-- Words ignored by the search: they appear in almost every full name ("... du
-- Sénégal") and would make any query starting with "sen" match everything.
-- Must match SEARCH_STOP_WORDS in src/lib/text.ts.

CREATE FUNCTION search_terms(input text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(normalize_search(input), '\m(senegal)\M', ' ', 'g'),
    ' +', ' ', 'g'))
$$;

CREATE OR REPLACE FUNCTION establishment_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := search_terms(NEW.name || ' ' || array_to_string(NEW.aliases, ' '));
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION service_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := search_terms(
    coalesce((SELECT t.text FROM translation t
              WHERE t.target_table = 'service' AND t.target_id = NEW.id
                AND t.field = 'label' AND t.language = 'fr'), '')
    || ' ' || array_to_string(NEW.synonyms, ' '));
  RETURN NEW;
END
$$;

-- Recompute the stored values (the triggers fire on these columns).
UPDATE establishment SET aliases = aliases;
UPDATE service SET synonyms = synonyms;
