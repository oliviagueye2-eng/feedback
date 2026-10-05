/**
 * Data access for the registry (establishment, service, municipality, qr_code).
 */
import { invalidInput } from "../domain/errors";
import type {
  EstablishmentScope,
  EstablishmentSearchResult,
  EstablishmentSummary,
  EstablishmentType,
  Sector,
} from "../domain/types";
import { OTHER_TYPE } from "../domain/types";
import { query } from "./client";

export interface EstablishmentDetail extends EstablishmentSummary {
  services: { id: number; code: string; label: string | null }[];
}

export interface NewUserEstablishment {
  rawInput: string;
  sectorCode: string;
  /** A type of the sector, or OTHER_TYPE; ignored when the sector has no types. */
  typeCode: string | null;
  municipalityInput: string | null;
}

interface SummaryRow {
  id: string;
  name: string;
  municipality_name: string | null;
  type_code: string | null;
  sector_label: string | null;
  scope: EstablishmentScope;
  organization_code: string | null;
  organization_name: string | null;
}

interface DetailRow extends SummaryRow {
  services: { id: number; code: string; label: string | null }[];
}

const toSummary = (row: SummaryRow): EstablishmentSummary => ({
  id: row.id,
  name: row.name,
  municipalityName: row.municipality_name,
  typeCode: row.type_code,
  sectorLabel: row.sector_label,
  scope: row.scope,
  organizationCode: row.organization_code,
  organizationName: row.organization_name,
});

/**
 * Columns and joins shared by every query returning an establishment summary.
 * The municipality typed by a user (screen 0c) stands in until an agent links a real one.
 */
const SUMMARY_COLUMNS = `e.id, e.name,
  coalesce(m.name, e.municipality_input) AS municipality_name, et.code AS type_code,
  sl.label AS sector_label, e.scope, o.code AS organization_code,
  o.name AS organization_name`;

const SUMMARY_JOINS = `
  LEFT JOIN municipality m ON m.id = e.municipality_id
  LEFT JOIN establishment_type et ON et.id = e.type_id
  LEFT JOIN organization o ON o.id = e.organization_id
  LEFT JOIN sector_translation sl ON sl.sector_id = coalesce(et.sector_id, e.sector_id)
    AND sl.language = 'fr'`;

const toDetail = (row: DetailRow): EstablishmentDetail => ({
  ...toSummary(row),
  services: row.services,
});

/**
 * Searches active establishments on establishment.search_text (name and
 * aliases), and service.search_text translated into the establishments
 * offering it. `terms` is normalized, without stop words (see toSearchTerms).
 *
 * Two ways to match:
 * - start of words: each word typed begins a word of the name or an alias
 *   ("sen" → Senelec, "ucad" → UCAD). Always on.
 * - tolerance to typos (`fuzzy`, from 5 letters): pg_trgm's word_similarity,
 *   operator <%, threshold 0.6 ("dantek" → Dantec).
 *
 * Municipality named in the query ("etat civil grand yoff"): when some matches
 * are in it, only they are shown. Order: those whose displayed name matches by start of words
 * (before a match on an alias only), then start-of-word matches before typo
 * matches, then closeness, then an organisation "in general" before its
 * agencies, then the name. Names and services are matched on the words other
 * than the municipality, which only serves to order.
 */
export async function searchActiveEstablishments(
  terms: string,
  limit: number,
  fuzzy: boolean,
): Promise<EstablishmentSearchResult> {
  const rows = await query<SummaryRow & { service_match: boolean }>(
    `WITH input AS (
       SELECT $1::text AS q, $3::boolean AS fuzzy
     ),
     municipality_in_query AS (
       SELECT m.id, m.search_name
       FROM municipality m, input
       WHERE m.search_name <> ''
         AND ' ' || input.q || ' ' LIKE '% ' || m.search_name || ' %'
     ),
     without_municipality AS (
       SELECT coalesce(
                nullif(btrim(replace(' ' || input.q || ' ',
                  ' ' || (SELECT search_name FROM municipality_in_query
                          ORDER BY length(search_name) DESC LIMIT 1) || ' ', ' ')), ''),
                input.q) AS q
       FROM input
     ),
     words AS (
       SELECT DISTINCT word FROM input, regexp_split_to_table(input.q, ' ') AS word WHERE word <> ''
     ),
     -- Words typed, without the municipality (the whole text when it is only a municipality).
     service_words AS (
       SELECT DISTINCT word FROM without_municipality w, regexp_split_to_table(w.q, ' ') AS word WHERE word <> ''
     ),
     -- The words other than the municipality must match: "mairie grand yoff"
     -- lists town halls (Grand Yoff first), not everything in Grand Yoff.
     -- tier 2: every word starts a word; tier 1: close enough (typos).
     by_name AS (
       SELECT e.id,
              CASE WHEN NOT EXISTS (SELECT 1 FROM service_words WHERE e.search_text !~ ('(^| )' || word))
                   THEN 2 ELSE 1 END AS tier,
              word_similarity(w.q, e.search_text) AS score
       FROM establishment e, without_municipality w, input
       WHERE e.status = 'active'
         AND (NOT EXISTS (SELECT 1 FROM service_words WHERE e.search_text !~ ('(^| )' || word))
              OR (input.fuzzy AND w.q <% e.search_text))
     ),
     services AS (
       SELECT s.id,
              CASE WHEN NOT EXISTS (SELECT 1 FROM service_words WHERE s.search_text !~ ('(^| )' || word))
                   THEN 2 ELSE 1 END AS tier,
              word_similarity(w.q, s.search_text) AS score
       FROM service s, without_municipality w, input
       WHERE NOT EXISTS (SELECT 1 FROM service_words WHERE s.search_text !~ ('(^| )' || word))
          OR (input.fuzzy AND w.q <% s.search_text)
     ),
     by_service AS (
       SELECT es.establishment_id AS id, max(sv.tier) AS tier, max(sv.score) AS score
       FROM services sv
       JOIN establishment_service es ON es.service_id = sv.id
       GROUP BY es.establishment_id
     ),
     scored AS (
       SELECT id, max(tier * 10 + score) AS rank
       FROM (SELECT * FROM by_name UNION ALL SELECT * FROM by_service) AS matches
       GROUP BY id
     ),
     -- Matches in the municipality typed. When there are some, only they are shown.
     in_municipality AS (
       SELECT scored.id
       FROM scored JOIN establishment e ON e.id = scored.id
       WHERE e.municipality_id IN (SELECT id FROM municipality_in_query)
     )
     SELECT ${SUMMARY_COLUMNS},
            coalesce((SELECT max(tier * 10 + score) FROM services)
                       >= coalesce((SELECT max(tier * 10 + score) FROM by_name), 0), false)
              AS service_match
     FROM scored
     JOIN establishment e ON e.id = scored.id AND e.status = 'active'
     ${SUMMARY_JOINS}
     WHERE NOT EXISTS (SELECT 1 FROM in_municipality) OR e.id IN (SELECT id FROM in_municipality)
     ORDER BY coalesce(e.municipality_id IN (SELECT id FROM municipality_in_query), false) DESC,
              NOT EXISTS (SELECT 1 FROM words WHERE search_terms(e.name) !~ ('(^| )' || word)) DESC,
              scored.rank DESC,
              e.scope = 'general' DESC,
              e.name
     LIMIT $2`,
    [terms, limit, fuzzy],
  );
  return {
    matchType: rows[0]?.service_match ? "service" : "establishment",
    results: rows.map(toSummary),
    suggestions: [],
  };
}

/**
 * Screen 0b ("Vouliez-vous dire"): looser matches, used only when the search
 * found nothing. Each word of 3 letters or more is compared on its own, so a
 * single recognisable word is enough ("hopitl dantek fan" finds Le Dantec).
 * Not index-assisted: fine while it runs only after an empty search.
 */
export async function findSimilarEstablishments(
  normalizedQuery: string,
  limit: number,
): Promise<EstablishmentSummary[]> {
  const rows = await query<SummaryRow>(
    `WITH words AS (
       SELECT DISTINCT word FROM regexp_split_to_table($1, ' ') AS word WHERE length(word) >= 3
     ),
     scored AS (
       SELECT e.id, sum(word_similarity(w.word, e.search_text)) AS score
       FROM establishment e, words w
       WHERE e.status = 'active'
       GROUP BY e.id
       HAVING max(word_similarity(w.word, e.search_text)) >= 0.6
     )
     SELECT ${SUMMARY_COLUMNS}
     FROM scored
     JOIN establishment e ON e.id = scored.id
     ${SUMMARY_JOINS}
     ORDER BY scored.score DESC, e.name
     LIMIT $2`,
    [normalizedQuery, limit],
  );
  return rows.map(toSummary);
}

/** Sectors with their French label, in alphabetical order (screen 0c). */
export async function listSectors(): Promise<Sector[]> {
  return query<Sector>(
    `SELECT s.code, t.label
     FROM sector s
     JOIN sector_translation t ON t.sector_id = s.id AND t.language = 'fr'
     ORDER BY normalize_search(t.label)`,
  );
}

export async function listEstablishmentTypes(): Promise<EstablishmentType[]> {
  return query<EstablishmentType>(
    `SELECT et.code, t.label, s.code AS "sectorCode"
     FROM establishment_type et
     JOIN establishment_type_translation t ON t.establishment_type_id = et.id AND t.language = 'fr'
     JOIN sector s ON s.id = et.sector_id
     ORDER BY normalize_search(t.label)`,
  );
}

const DETAIL_COLUMNS = `
  ${SUMMARY_COLUMNS},
  coalesce((SELECT json_agg(json_build_object('id', s.id, 'code', s.code, 'label', st.label)
                           ORDER BY coalesce(st.label, s.code))
            FROM establishment_service es JOIN service s ON s.id = es.service_id
            LEFT JOIN service_translation st ON st.service_id = s.id AND st.language = 'fr'
            WHERE es.establishment_id = e.id), '[]') AS services`;

const DETAIL_JOINS = SUMMARY_JOINS;

/**
 * An establishment that accepts feedback: active, or pending review (typed by
 * a user). A merged establishment leads to the one that replaces it.
 */
export async function findEstablishmentById(
  id: string,
): Promise<EstablishmentDetail | null> {
  const rows = await query<DetailRow>(
    `SELECT ${DETAIL_COLUMNS}
     FROM establishment requested
     JOIN establishment e ON e.id = coalesce(requested.merged_into_id, requested.id)
     ${DETAIL_JOINS}
     WHERE requested.id = $1 AND e.status IN ('active', 'pending_review')`,
    [id],
  );
  return rows[0] ? toDetail(rows[0]) : null;
}

/** Only active QR codes of active establishments (codes of a closed one are deactivated). */
export async function findEstablishmentByQrCode(
  code: string,
): Promise<{ establishment: EstablishmentDetail; serviceId: number | null; qrCodeId: string } | null> {
  const rows = await query<DetailRow & { service_id: number | null; qr_code_id: string }>(
    `SELECT ${DETAIL_COLUMNS}, qr.service_id, qr.id AS qr_code_id
     FROM qr_code qr
     JOIN establishment e ON e.id = qr.establishment_id
     ${DETAIL_JOINS}
     WHERE qr.code = $1 AND qr.is_active AND e.status = 'active'`,
    [code],
  );
  const row = rows[0];
  if (!row) return null;
  return { establishment: toDetail(row), serviceId: row.service_id, qrCodeId: row.qr_code_id };
}

/** Inserts with status = pending_review and source = user. Returns the new id. */
export async function insertUserEstablishment(
  input: NewUserEstablishment,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO establishment (name, raw_input, sector_id, type_id, municipality_input, status, source)
     SELECT $1, $1, s.id, et.id, $4, 'pending_review', 'user'
     FROM sector s
     LEFT JOIN establishment_type et ON et.code = $3 AND et.sector_id = s.id
     WHERE s.code = $2
       AND (et.id IS NOT NULL OR $3 = $5
            OR NOT EXISTS (SELECT 1 FROM establishment_type t WHERE t.sector_id = s.id))
     RETURNING id`,
    [input.rawInput, input.sectorCode, input.typeCode, input.municipalityInput, OTHER_TYPE],
  );
  if (!rows[0]) throw invalidInput("Unknown sector, or type missing or not of the sector");
  return rows[0].id;
}
