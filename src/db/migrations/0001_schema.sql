-- Schema of the user satisfaction platform (rewritten on 2026-10-02, before
-- launch, from the migrations 0001 to 0019 of the prototype).
-- Source of truth: docs/architecture-base-de-donnees.md
-- Conventions: English identifiers, snake_case, singular table names, enums as
-- text + CHECK (easier to evolve than PostgreSQL enum types), user-facing texts
-- in one translation table per translated table (foreign key, one row per
-- language).

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

-- Searched text: normalized, « hôtel de ville » searched as « mairie »
-- (equivalent expressions), and « Sénégal » ignored (in almost every full
-- name, it would make any query starting with « sen » match everything).
-- Must match toSearchTerms() in src/lib/text.ts (SEARCH_EQUIVALENTS,
-- SEARCH_STOP_WORDS).
CREATE FUNCTION search_terms(input text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      regexp_replace(normalize_search(input), '\mhotel de ville\M', 'mairie', 'g'),
      '\m(senegal)\M', ' ', 'g'),
    ' +', ' ', 'g'))
$$;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

-- ---------------------------------------------------------------------------
-- Questions: one bank, lists of questions attached to the levels
-- ---------------------------------------------------------------------------
-- Each question exists once (the bank), with its answers and texts. A list
-- (question_set) is an ordered selection of questions of the bank. Lists are
-- attached to a sector, an establishment type or a service; screen 6 shows
-- the lists of the feedback's sector, then type, then service, added up from
-- the most general to the most specific. Special lists, found by their code:
-- ESSENTIAL (screen 2, everyone), COMMON (screen 6b, users not satisfied),
-- GENERIC (attached to the private sectors, and used when the sector is
-- unknown). A question already answered is never changed: a new question
-- replaces it in the lists, and old feedbacks stay readable.

CREATE TABLE question (
  id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('scale_5', 'yes_partial_no', 'single_choice', 'text'))
);

CREATE TABLE answer_option (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id int NOT NULL REFERENCES question (id),
  code        text NOT NULL,
  -- An order for the results where the answers have one (more is better, or
  -- longer for a wait); none for answers outside the scale (« Je ne sais pas »).
  value       smallint,
  position    smallint NOT NULL,
  UNIQUE (question_id, code),
  UNIQUE (question_id, position),
  -- Lets answer and question_condition check that an option belongs to its question.
  UNIQUE (id, question_id)
);

CREATE TABLE question_translation (
  question_id int NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  language    text NOT NULL,
  label       text NOT NULL,
  PRIMARY KEY (question_id, language)
);

-- follow_up_prompt: the prompt once shown above the free text after this answer
-- to the essential question (kept, no longer shown since option D).
CREATE TABLE answer_option_translation (
  answer_option_id int NOT NULL REFERENCES answer_option (id) ON DELETE CASCADE,
  language         text NOT NULL,
  label            text NOT NULL,
  follow_up_prompt text,
  PRIMARY KEY (answer_option_id, language)
);

CREATE TABLE question_set (
  id   smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE
);

CREATE TABLE question_set_item (
  question_set_id smallint NOT NULL REFERENCES question_set (id) ON DELETE CASCADE,
  question_id     int NOT NULL REFERENCES question (id),
  position        smallint NOT NULL,
  PRIMARY KEY (question_set_id, question_id),
  UNIQUE (question_set_id, position)
);

-- « In this list, this question is shown only if that question got one of
-- these answers. » One row per accepted answer; an item without rows is always
-- shown. Per item, not per question: the same question can depend on another
-- one in each list (« Prévenu(e) avant les coupures ? » after the cuts of
-- electricity, or the days without water).
CREATE TABLE question_condition (
  question_set_id        smallint NOT NULL,
  question_id            int NOT NULL,
  depends_on_question_id int NOT NULL,
  option_id              int NOT NULL,
  PRIMARY KEY (question_set_id, question_id, option_id),
  FOREIGN KEY (question_set_id, question_id)
    REFERENCES question_set_item (question_set_id, question_id) ON DELETE CASCADE,
  FOREIGN KEY (option_id, depends_on_question_id) REFERENCES answer_option (id, question_id),
  CHECK (question_id <> depends_on_question_id)
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

-- A sector is neither public nor private: establishment.ownership says so.
CREATE TABLE sector (
  id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  question_set_id smallint REFERENCES question_set (id)
);

CREATE TABLE sector_translation (
  sector_id smallint NOT NULL REFERENCES sector (id) ON DELETE CASCADE,
  language  text NOT NULL,
  label     text NOT NULL,
  PRIMARY KEY (sector_id, language)
);

CREATE TABLE establishment_type (
  id              int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  sector_id       smallint NOT NULL REFERENCES sector (id),
  question_set_id smallint REFERENCES question_set (id)
);

CREATE TABLE establishment_type_translation (
  establishment_type_id int NOT NULL REFERENCES establishment_type (id) ON DELETE CASCADE,
  language              text NOT NULL,
  label                 text NOT NULL,
  PRIMARY KEY (establishment_type_id, language)
);

-- Organisations with several establishments (Senelec, operators, banks…). An
-- organisation is rated at one of its places (scope = site: an agency, a line,
-- a ship) or « in general » (scope = general: cuts, bills, customer service),
-- a special establishment of the organisation without address or municipality.
-- Its published overall score adds up all its establishments.
CREATE TABLE organization (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      text NOT NULL UNIQUE,
  -- Usual name, shown everywhere (Senelec).
  name      text NOT NULL,
  -- Official full name, when it differs. Searchable through the aliases of the
  -- « in general » establishment.
  full_name text,
  sector_id smallint NOT NULL REFERENCES sector (id)
);

CREATE TABLE establishment (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  aliases            text[] NOT NULL DEFAULT '{}',
  -- Filled by trigger from name + aliases.
  search_text        text NOT NULL DEFAULT '',
  type_id            int REFERENCES establishment_type (id),
  -- Sector when the type is unknown (registry without types yet, or typed by a
  -- user on screen 0c, sector optional). Where both exist, the type's wins.
  sector_id          smallint REFERENCES sector (id),
  organization_id    smallint REFERENCES organization (id),
  scope              text NOT NULL DEFAULT 'site' CHECK (scope IN ('site', 'general')),
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
  CHECK (source = 'registry' OR raw_input IS NOT NULL),
  -- « In general » belongs to an organisation and is nowhere in particular.
  CONSTRAINT establishment_general_check CHECK (
    scope = 'site'
    OR (organization_id IS NOT NULL AND municipality_id IS NULL AND address IS NULL)
  )
);

-- A service is what the user came to do, shared by several establishments
-- (« État civil » for every town hall, « Un trajet en bus ou en train » for
-- every bus or train operator), never the fact of complaining.
CREATE TABLE service (
  id              int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  sector_id       smallint NOT NULL REFERENCES sector (id),
  question_set_id smallint REFERENCES question_set (id),
  synonyms        text[] NOT NULL DEFAULT '{}',
  -- Filled by trigger from the French label + synonyms.
  search_text     text NOT NULL DEFAULT ''
);

CREATE TABLE service_translation (
  service_id int NOT NULL REFERENCES service (id) ON DELETE CASCADE,
  language   text NOT NULL,
  label      text NOT NULL,
  PRIMARY KEY (service_id, language)
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
-- Topics of screen 2b (« Bien » / « Pas bien »)
-- ---------------------------------------------------------------------------

CREATE TABLE topic (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      text NOT NULL UNIQUE,
  position  smallint NOT NULL,
  -- A topic that leaves the list is deactivated, not deleted: feedbacks already
  -- given with it stay readable.
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE topic_translation (
  topic_id smallint NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
  language text NOT NULL,
  label    text NOT NULL,
  PRIMARY KEY (topic_id, language)
);

-- A topic without rows is common and shown in every sector; a topic with rows
-- is shown only in those sectors.
CREATE TABLE topic_sector (
  topic_id  smallint NOT NULL REFERENCES topic (id),
  sector_id smallint NOT NULL REFERENCES sector (id),
  PRIMARY KEY (topic_id, sector_id)
);

-- ---------------------------------------------------------------------------
-- Collection
-- ---------------------------------------------------------------------------

CREATE TABLE feedback (
  -- Generated by the phone (no default): retries after a network cut never duplicate.
  id               uuid PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES establishment (id),
  service_id       int REFERENCES service (id),
  qr_code_id       uuid REFERENCES qr_code (id),
  channel          text NOT NULL CHECK (channel IN ('qr', 'search', 'link')),
  language         text NOT NULL,
  step             text NOT NULL DEFAULT 'essential'
                   CHECK (step IN ('essential', 'detailed', 'completed')),
  visit_period     text CHECK (visit_period IN ('today', 'under_week', 'under_month', 'over_month')),
  visit_month      date CHECK (extract(day FROM visit_month) = 1),
  -- Rounded to the hour to limit re-identification.
  started_at       timestamptz NOT NULL DEFAULT date_trunc('hour', now())
                   CHECK (started_at = date_trunc('hour', started_at)),
  completed_at     timestamptz CHECK (completed_at = date_trunc('hour', completed_at)),
  -- visit_month is known exactly when the visit is recent enough.
  CHECK ((visit_period IS NULL OR visit_period = 'over_month') = (visit_month IS NULL)),
  CHECK ((step = 'completed') = (completed_at IS NOT NULL))
);

-- One row per question answered; the question is the bank's, so the same
-- question gives comparable answers in every sector.
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

-- The free text of screen 2b, apart from the answers because it is moderated.
CREATE TABLE comment (
  feedback_id      uuid PRIMARY KEY REFERENCES feedback (id),
  -- Answer given to the essential question when the text was written.
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
  sentiment   text NOT NULL CHECK (sentiment IN ('positive', 'negative')),
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
-- Triggers
-- ---------------------------------------------------------------------------

CREATE FUNCTION establishment_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := search_terms(NEW.name || ' ' || array_to_string(NEW.aliases, ' '));
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

-- service.search_text = French label + synonyms.
CREATE FUNCTION service_search_text() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_text := search_terms(
    coalesce((SELECT st.label FROM service_translation st
              WHERE st.service_id = NEW.id AND st.language = 'fr'), '')
    || ' ' || array_to_string(NEW.synonyms, ' '));
  RETURN NEW;
END
$$;

CREATE TRIGGER service_search_text
  BEFORE INSERT OR UPDATE OF synonyms ON service
  FOR EACH ROW EXECUTE FUNCTION service_search_text();

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

-- A QR code is displayed in a place: never on an « in general » establishment.
CREATE FUNCTION qr_code_site_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT scope FROM establishment WHERE id = NEW.establishment_id) = 'general' THEN
    RAISE EXCEPTION 'A QR code cannot point to an "in general" establishment'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'qr_code_site_only';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER qr_code_site_only
  BEFORE INSERT OR UPDATE OF establishment_id ON qr_code
  FOR EACH ROW EXECUTE FUNCTION qr_code_site_only();

CREATE FUNCTION establishment_general_without_qr_code() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM qr_code WHERE establishment_id = NEW.id) THEN
    RAISE EXCEPTION 'An establishment with QR codes cannot become "in general"'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'qr_code_site_only';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER establishment_general_without_qr_code
  BEFORE UPDATE OF scope ON establishment
  FOR EACH ROW WHEN (NEW.scope = 'general')
  EXECUTE FUNCTION establishment_general_without_qr_code();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Autocomplete: only active establishments are proposed.
CREATE INDEX establishment_search_text_trgm ON establishment
  USING gin (search_text gin_trgm_ops) WHERE status = 'active';
CREATE INDEX service_search_text_trgm ON service USING gin (search_text gin_trgm_ops);
CREATE INDEX municipality_search_name_trgm ON municipality USING gin (search_name gin_trgm_ops);

-- At most one « in general » establishment per organisation.
CREATE UNIQUE INDEX establishment_one_general_per_organization
  ON establishment (organization_id) WHERE scope = 'general';
CREATE INDEX establishment_organization_idx ON establishment (organization_id);
CREATE INDEX establishment_municipality_idx ON establishment (municipality_id);
CREATE INDEX establishment_status_idx ON establishment (status) WHERE status <> 'active';
CREATE INDEX establishment_service_service_idx ON establishment_service (service_id);
CREATE INDEX qr_code_establishment_idx ON qr_code (establishment_id);
CREATE INDEX question_set_item_question_idx ON question_set_item (question_id);
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
       round(avg(CASE g.code WHEN 'YES' THEN 1 WHEN 'PARTLY' THEN 0.5 WHEN 'NO' THEN 0 END), 3)
         AS goal_achieved_rate
FROM f
JOIN satisfaction s ON s.feedback_id = f.id
LEFT JOIN goal g ON g.feedback_id = f.id
GROUP BY f.establishment_id, f.service_id, f.visit_month;

-- Required by REFRESH ... CONCURRENTLY (column names only, no NULLs).
CREATE UNIQUE INDEX monthly_stats_key ON monthly_stats (establishment_id, service_key, month);
