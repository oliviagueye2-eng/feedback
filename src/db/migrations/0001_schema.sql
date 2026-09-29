-- Schema of the user satisfaction platform.
-- Source of truth: docs/architecture-base-de-donnees.md
-- Conventions: English identifiers, snake_case, singular table names,
-- enums as text + CHECK (easier to evolve than PostgreSQL enum types).

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Search normalization: lowercase, no accents, non-alphanumerics become single
-- spaces. Must match normalizeForSearch() in src/lib/text.ts.
CREATE FUNCTION normalize_search(input text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT btrim(regexp_replace(lower(unaccent(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g'))
$$;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

-- ---------------------------------------------------------------------------
-- Questionnaires (created first: sector and service point to them)
-- ---------------------------------------------------------------------------

CREATE TABLE questionnaire (
  id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code         text NOT NULL,
  version      int NOT NULL DEFAULT 1,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  UNIQUE (code, version),
  CHECK ((status = 'draft') = (published_at IS NULL))
);

CREATE TABLE question (
  id               int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  questionnaire_id int NOT NULL REFERENCES questionnaire (id),
  code             text NOT NULL,
  type             text NOT NULL
                   CHECK (type IN ('scale_5', 'yes_partial_no', 'single_choice', 'text')),
  position         smallint NOT NULL,
  is_required      boolean NOT NULL DEFAULT false,
  UNIQUE (questionnaire_id, code)
);

CREATE TABLE answer_option (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id int NOT NULL REFERENCES question (id),
  code        text NOT NULL,
  value       smallint,
  position    smallint NOT NULL,
  UNIQUE (question_id, code),
  -- Lets answer check that the chosen option belongs to the answered question.
  UNIQUE (id, question_id)
);

-- ---------------------------------------------------------------------------
-- Registry
-- ---------------------------------------------------------------------------

CREATE TABLE region (
  id   smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE department (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_id smallint NOT NULL REFERENCES region (id),
  code      text NOT NULL UNIQUE,
  name      text NOT NULL
);

CREATE TABLE municipality (
  id            int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_id smallint NOT NULL REFERENCES department (id),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  -- Filled by trigger; used to spot a municipality name in a search query.
  search_name   text NOT NULL DEFAULT ''
);

CREATE TABLE sector (
  id                        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code                      text NOT NULL UNIQUE,
  fallback_questionnaire_id int REFERENCES questionnaire (id)
);

CREATE TABLE establishment_type (
  id        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      text NOT NULL UNIQUE,
  sector_id smallint NOT NULL REFERENCES sector (id)
);

CREATE TABLE establishment (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  aliases            text[] NOT NULL DEFAULT '{}',
  -- Filled by trigger from name + aliases.
  search_text        text NOT NULL DEFAULT '',
  type_id            int REFERENCES establishment_type (id),
  ownership          text CHECK (ownership IN ('public', 'private', 'community')),
  municipality_id    int REFERENCES municipality (id),
  address            text,
  status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'pending_review', 'rejected', 'merged', 'closed')),
  closed_at          timestamptz,
  source             text NOT NULL DEFAULT 'registry'
                     CHECK (source IN ('registry', 'user')),
  raw_input          text,
  municipality_input text,
  merged_into_id     uuid REFERENCES establishment (id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'closed') = (closed_at IS NOT NULL)),
  CHECK ((status = 'merged') = (merged_into_id IS NOT NULL)),
  CHECK (merged_into_id IS DISTINCT FROM id),
  CHECK (source = 'registry' OR raw_input IS NOT NULL)
);

CREATE TABLE service (
  id                        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code                      text NOT NULL UNIQUE,
  sector_id                 smallint NOT NULL REFERENCES sector (id),
  detailed_questionnaire_id int REFERENCES questionnaire (id),
  synonyms                  text[] NOT NULL DEFAULT '{}',
  -- Filled by trigger from the French label (translation) + synonyms.
  search_text               text NOT NULL DEFAULT ''
);

CREATE TABLE establishment_service (
  establishment_id uuid NOT NULL REFERENCES establishment (id),
  service_id       int NOT NULL REFERENCES service (id),
  PRIMARY KEY (establishment_id, service_id)
);

CREATE TABLE qr_code (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,
  establishment_id uuid NOT NULL REFERENCES establishment (id),
  service_id       int REFERENCES service (id),
  location_label   text,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Topics and translations
-- ---------------------------------------------------------------------------

CREATE TABLE topic (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      text NOT NULL UNIQUE,
  position  smallint NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- Optional: which topics to show per sector. No row for a sector = all active topics.
CREATE TABLE topic_sector (
  topic_id  smallint NOT NULL REFERENCES topic (id),
  sector_id smallint NOT NULL REFERENCES sector (id),
  PRIMARY KEY (topic_id, sector_id)
);

-- All user-facing texts. target_id is not a foreign key (polymorphic).
CREATE TABLE translation (
  target_table text NOT NULL
               CHECK (target_table IN ('question', 'answer_option', 'topic', 'service', 'sector', 'establishment_type')),
  target_id    int NOT NULL,
  field        text NOT NULL DEFAULT 'label'
               CHECK (field IN ('label', 'follow_up_prompt')),
  language     text NOT NULL,
  text         text NOT NULL,
  PRIMARY KEY (target_table, target_id, field, language)
);

-- ---------------------------------------------------------------------------
-- Collection
-- ---------------------------------------------------------------------------

CREATE TABLE feedback (
  -- Generated by the phone (no default): retries after a network cut never duplicate.
  id                        uuid PRIMARY KEY,
  establishment_id          uuid NOT NULL REFERENCES establishment (id),
  service_id                int REFERENCES service (id),
  qr_code_id                uuid REFERENCES qr_code (id),
  channel                   text NOT NULL CHECK (channel IN ('qr', 'search', 'link')),
  language                  text NOT NULL,
  step                      text NOT NULL DEFAULT 'essential'
                            CHECK (step IN ('essential', 'detailed', 'completed')),
  detailed_questionnaire_id int REFERENCES questionnaire (id),
  visit_period              text CHECK (visit_period IN ('today', 'under_week', 'under_month', 'over_month')),
  visit_month               date CHECK (extract(day FROM visit_month) = 1),
  -- Rounded to the hour to limit re-identification.
  started_at                timestamptz NOT NULL DEFAULT date_trunc('hour', now())
                            CHECK (started_at = date_trunc('hour', started_at)),
  completed_at              timestamptz,
  -- visit_month is known exactly when the visit is recent enough.
  CHECK ((visit_period IS NULL OR visit_period = 'over_month') = (visit_month IS NULL)),
  CHECK ((step = 'completed') = (completed_at IS NOT NULL))
);

CREATE TABLE answer (
  feedback_id uuid NOT NULL REFERENCES feedback (id),
  question_id int NOT NULL REFERENCES question (id),
  option_id   int,
  text_value  text,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (feedback_id, question_id),
  -- The chosen option must belong to the answered question.
  FOREIGN KEY (option_id, question_id) REFERENCES answer_option (id, question_id),
  CHECK (option_id IS NOT NULL OR text_value IS NOT NULL)
);

CREATE TABLE comment (
  feedback_id      uuid PRIMARY KEY REFERENCES feedback (id),
  -- Option chosen at the essential question: tells which prompt was shown.
  prompt_option_id int NOT NULL REFERENCES answer_option (id),
  text             text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'published', 'hidden')),
  hidden_reason    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'hidden') = (hidden_reason IS NOT NULL))
);

CREATE TABLE feedback_topic (
  feedback_id uuid NOT NULL REFERENCES feedback (id),
  topic_id    smallint NOT NULL REFERENCES topic (id),
  -- Only for the OTHER topic (enforced in src/domain): the topic named by the user.
  other_text  text CHECK (char_length(other_text) BETWEEN 1 AND 50),
  PRIMARY KEY (feedback_id, topic_id)
);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------

CREATE TABLE search_log (
  id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  query                     text NOT NULL,
  result_count              int NOT NULL,
  selected_establishment_id uuid REFERENCES establishment (id),
  created_establishment_id  uuid REFERENCES establishment (id),
  searched_at               timestamptz NOT NULL DEFAULT date_trunc('hour', now())
);

-- Back-office agents. Authentication details are to be designed.
CREATE TABLE agent (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE moderation_action (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     uuid NOT NULL REFERENCES agent (id),
  action       text NOT NULL CHECK (action IN (
                 'approve_establishment', 'merge_establishment', 'reject_establishment',
                 'close_establishment', 'hide_comment', 'publish_comment')),
  target_table text NOT NULL,
  target_id    text NOT NULL,
  reason       text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Search text triggers
-- ---------------------------------------------------------------------------

CREATE FUNCTION establishment_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := normalize_search(NEW.name || ' ' || array_to_string(NEW.aliases, ' '));
  RETURN NEW;
END
$$;

CREATE TRIGGER establishment_search_text
  BEFORE INSERT OR UPDATE OF name, aliases ON establishment
  FOR EACH ROW EXECUTE FUNCTION establishment_search_text();

CREATE TRIGGER establishment_updated_at
  BEFORE UPDATE ON establishment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE FUNCTION municipality_search_name() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_name := normalize_search(NEW.name);
  RETURN NEW;
END
$$;

CREATE TRIGGER municipality_search_name
  BEFORE INSERT OR UPDATE OF name ON municipality
  FOR EACH ROW EXECUTE FUNCTION municipality_search_name();

-- service.search_text = French label (from translation) + synonyms.
CREATE FUNCTION service_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := normalize_search(
    coalesce((SELECT t.text FROM translation t
              WHERE t.target_table = 'service' AND t.target_id = NEW.id
                AND t.field = 'label' AND t.language = 'fr'), '')
    || ' ' || array_to_string(NEW.synonyms, ' '));
  RETURN NEW;
END
$$;

CREATE TRIGGER service_search_text
  BEFORE INSERT OR UPDATE OF synonyms ON service
  FOR EACH ROW EXECUTE FUNCTION service_search_text();

-- When a service's French label changes, recompute its search_text.
CREATE FUNCTION translation_refresh_service() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  affected int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected := OLD.target_id;
  ELSE
    affected := NEW.target_id;
  END IF;
  UPDATE service SET synonyms = synonyms WHERE id = affected;
  RETURN NULL;
END
$$;

CREATE TRIGGER translation_refresh_service_ins_upd
  AFTER INSERT OR UPDATE ON translation
  FOR EACH ROW
  WHEN (NEW.target_table = 'service' AND NEW.field = 'label' AND NEW.language = 'fr')
  EXECUTE FUNCTION translation_refresh_service();

CREATE TRIGGER translation_refresh_service_del
  AFTER DELETE ON translation
  FOR EACH ROW
  WHEN (OLD.target_table = 'service' AND OLD.field = 'label' AND OLD.language = 'fr')
  EXECUTE FUNCTION translation_refresh_service();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Autocomplete: only active establishments are proposed.
CREATE INDEX establishment_search_text_trgm ON establishment
  USING gin (search_text gin_trgm_ops) WHERE status = 'active';
CREATE INDEX service_search_text_trgm ON service USING gin (search_text gin_trgm_ops);
CREATE INDEX municipality_search_name_trgm ON municipality USING gin (search_name gin_trgm_ops);

CREATE INDEX establishment_municipality_idx ON establishment (municipality_id);
CREATE INDEX establishment_status_idx ON establishment (status) WHERE status <> 'active';
CREATE INDEX establishment_service_service_idx ON establishment_service (service_id);
CREATE INDEX qr_code_establishment_idx ON qr_code (establishment_id);
CREATE INDEX feedback_establishment_month_idx ON feedback (establishment_id, visit_month);
CREATE INDEX answer_question_idx ON answer (question_id);
CREATE INDEX comment_pending_idx ON comment (created_at) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Published results
-- ---------------------------------------------------------------------------

-- Refreshed every night (REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats).
-- One row per establishment, service and month of visit. Feedbacks of a merged
-- establishment count for the establishment that replaces it. Feedbacks without
-- a known recent visit month (over_month, or never answered) are excluded.
-- The publication threshold (minimum number of feedbacks) is applied when reading.
CREATE MATERIALIZED VIEW monthly_stats AS
WITH f AS (
  SELECT fb.id,
         coalesce(e.merged_into_id, e.id) AS establishment_id,
         fb.service_id,
         fb.visit_month
  FROM feedback fb
  JOIN establishment e ON e.id = fb.establishment_id
  WHERE fb.visit_month IS NOT NULL
),
satisfaction AS (
  SELECT a.feedback_id, ao.value
  FROM answer a
  JOIN question q ON q.id = a.question_id
  JOIN answer_option ao ON ao.id = a.option_id
  WHERE q.code = 'OVERALL_SATISFACTION'
),
goal AS (
  SELECT a.feedback_id, ao.code
  FROM answer a
  JOIN question q ON q.id = a.question_id
  JOIN answer_option ao ON ao.id = a.option_id
  WHERE q.code = 'GOAL_ACHIEVED'
)
SELECT f.establishment_id,
       f.service_id,
       coalesce(f.service_id, 0) AS service_key,
       f.visit_month AS month,
       count(s.value) AS feedback_count,
       round(avg(s.value), 2) AS avg_satisfaction,
       round(avg(CASE g.code WHEN 'YES' THEN 1 WHEN 'PARTIAL' THEN 0.5 WHEN 'NO' THEN 0 END), 3)
         AS goal_achieved_rate
FROM f
JOIN satisfaction s ON s.feedback_id = f.id
LEFT JOIN goal g ON g.feedback_id = f.id
GROUP BY f.establishment_id, f.service_id, f.visit_month;

-- Required by REFRESH ... CONCURRENTLY (column names only, no NULLs).
CREATE UNIQUE INDEX monthly_stats_key ON monthly_stats (establishment_id, service_key, month);
