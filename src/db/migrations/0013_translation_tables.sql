-- One translation table per translated table (validated 2026-10-01), instead
-- of the single polymorphic table « translation »: the database now checks
-- that every text belongs to an existing row (foreign key, removed with it),
-- and each text has its own column (label, follow_up_prompt).
-- Key: (row, language). The texts already there are moved, nothing is lost.

CREATE TABLE sector_translation (
  sector_id smallint NOT NULL REFERENCES sector (id) ON DELETE CASCADE,
  language  text NOT NULL,
  label     text NOT NULL,
  PRIMARY KEY (sector_id, language)
);

CREATE TABLE establishment_type_translation (
  establishment_type_id int NOT NULL REFERENCES establishment_type (id) ON DELETE CASCADE,
  language              text NOT NULL,
  label                 text NOT NULL,
  PRIMARY KEY (establishment_type_id, language)
);

CREATE TABLE service_translation (
  service_id int NOT NULL REFERENCES service (id) ON DELETE CASCADE,
  language   text NOT NULL,
  label      text NOT NULL,
  PRIMARY KEY (service_id, language)
);

CREATE TABLE topic_translation (
  topic_id smallint NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
  language text NOT NULL,
  label    text NOT NULL,
  PRIMARY KEY (topic_id, language)
);

CREATE TABLE question_translation (
  question_id int NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  language    text NOT NULL,
  label       text NOT NULL,
  PRIMARY KEY (question_id, language)
);

-- follow_up_prompt: the prompt once shown above the free text, after this
-- answer to the essential question (kept, no longer shown since option D).
CREATE TABLE answer_option_translation (
  answer_option_id int NOT NULL REFERENCES answer_option (id) ON DELETE CASCADE,
  language         text NOT NULL,
  label            text NOT NULL,
  follow_up_prompt text,
  PRIMARY KEY (answer_option_id, language)
);

-- Move the texts. Joining the target table drops any orphan text.
INSERT INTO sector_translation (sector_id, language, label)
SELECT s.id, t.language, t.text
FROM translation t JOIN sector s ON s.id = t.target_id
WHERE t.target_table = 'sector' AND t.field = 'label';

INSERT INTO establishment_type_translation (establishment_type_id, language, label)
SELECT et.id, t.language, t.text
FROM translation t JOIN establishment_type et ON et.id = t.target_id
WHERE t.target_table = 'establishment_type' AND t.field = 'label';

INSERT INTO topic_translation (topic_id, language, label)
SELECT tp.id, t.language, t.text
FROM translation t JOIN topic tp ON tp.id = t.target_id
WHERE t.target_table = 'topic' AND t.field = 'label';

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, t.language, t.text
FROM translation t JOIN question q ON q.id = t.target_id
WHERE t.target_table = 'question' AND t.field = 'label';

INSERT INTO answer_option_translation (answer_option_id, language, label, follow_up_prompt)
SELECT ao.id, l.language, l.text, p.text
FROM translation l
JOIN answer_option ao ON ao.id = l.target_id
LEFT JOIN translation p ON p.target_table = 'answer_option' AND p.target_id = l.target_id
  AND p.field = 'follow_up_prompt' AND p.language = l.language
WHERE l.target_table = 'answer_option' AND l.field = 'label';

-- service.search_text = French label + synonyms, now read from service_translation.
CREATE OR REPLACE FUNCTION service_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := search_terms(
    coalesce((SELECT st.label FROM service_translation st
              WHERE st.service_id = NEW.id AND st.language = 'fr'), '')
    || ' ' || array_to_string(NEW.synonyms, ' '));
  RETURN NEW;
END
$$;

-- When a service's French label changes, recompute its search_text.
CREATE FUNCTION service_translation_refresh_service() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE service SET synonyms = synonyms
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.service_id ELSE NEW.service_id END;
  RETURN NULL;
END
$$;

CREATE TRIGGER service_translation_refresh_service_ins_upd
  AFTER INSERT OR UPDATE ON service_translation
  FOR EACH ROW WHEN (NEW.language = 'fr')
  EXECUTE FUNCTION service_translation_refresh_service();

CREATE TRIGGER service_translation_refresh_service_del
  AFTER DELETE ON service_translation
  FOR EACH ROW WHEN (OLD.language = 'fr')
  EXECUTE FUNCTION service_translation_refresh_service();

-- Moved after the trigger: each service's search_text is recomputed from it.
INSERT INTO service_translation (service_id, language, label)
SELECT s.id, t.language, t.text
FROM translation t JOIN service s ON s.id = t.target_id
WHERE t.target_table = 'service' AND t.field = 'label';

-- The old table and its triggers.
DROP TRIGGER translation_refresh_service_ins_upd ON translation;
DROP TRIGGER translation_refresh_service_del ON translation;
DROP FUNCTION translation_refresh_service();
DROP TABLE translation;
