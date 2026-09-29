/**
 * Data access for the registry (establishment, service, municipality, qr_code).
 */
import { invalidInput } from "../domain/errors";
import type {
  EstablishmentScope,
  EstablishmentSearchResult,
  EstablishmentSummary,
  Sector,
} from "../domain/types";
import { query } from "./client";

export interface EstablishmentDetail extends EstablishmentSummary {
  services: { id: number; code: string }[];
}

export interface NewUserEstablishment {
  rawInput: string;
  sectorCode: string | null;
  municipalityInput: string | null;
}

export interface EstablishmentStats {
  month: string;
  feedbackCount: number;
  avgSatisfaction: number;
}

interface SummaryRow {
  id: string;
  name: string;
  municipality_name: string | null;
  type_code: string | null;
  sector_label: string | null;
  scope: EstablishmentScope;
}

interface DetailRow extends SummaryRow {
  services: { id: number; code: string }[];
}

const toSummary = (row: SummaryRow): EstablishmentSummary => ({
  id: row.id,
  name: row.name,
  municipalityName: row.municipality_name,
  typeCode: row.type_code,
  sectorLabel: row.sector_label,
  scope: row.scope,
});

/**
 * Columns and joins shared by every query returning an establishment summary.
 * The municipality typed by a user (screen 0c) stands in until an agent links a real one.
 */
const SUMMARY_COLUMNS = `e.id, e.name,
  coalesce(m.name, e.municipality_input) AS municipality_name, et.code AS type_code,
  sl.text AS sector_label, e.scope`;

const SUMMARY_JOINS = `
  LEFT JOIN municipality m ON m.id = e.municipality_id
  LEFT JOIN establishment_type et ON et.id = e.type_id
  LEFT JOIN translation sl ON sl.target_table = 'sector'
    AND sl.target_id = coalesce(et.sector_id, e.sector_id)
    AND sl.field = 'label' AND sl.language = 'fr'`;

const toDetail = (row: DetailRow): EstablishmentDetail => ({
  ...toSummary(row),
  services: row.services,
});

/**
 * Searches active establishments on establishment.search_text, and
 * service.search_text translated into the establishments offering it.
 * `normalizedQuery` is already lowercased and without accents.
 *
 * Matching uses pg_trgm's word_similarity (operator <%, threshold 0.6 by
 * default), so a short or misspelt query still finds a long name. When the
 * query contains a municipality name ("etat civil grand yoff"), establishments
 * of that municipality come first, and the service is looked up without it.
 * Between equal matches, an organisation "in general" comes before its agencies.
 */
export async function searchActiveEstablishments(
  normalizedQuery: string,
  limit: number,
): Promise<EstablishmentSearchResult> {
  const rows = await query<SummaryRow & { service_match: boolean }>(
    `WITH input AS (
       SELECT $1::text AS q
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
     by_name AS (
       SELECT e.id, word_similarity(input.q, e.search_text) AS score
       FROM establishment e, input
       WHERE e.status = 'active' AND input.q <% e.search_text
     ),
     by_service AS (
       SELECT es.establishment_id AS id, max(word_similarity(w.q, s.search_text)) AS score
       FROM without_municipality w
       JOIN service s ON w.q <% s.search_text
       JOIN establishment_service es ON es.service_id = s.id
       GROUP BY es.establishment_id
     ),
     scored AS (
       SELECT id, max(score) AS score
       FROM (SELECT * FROM by_name UNION ALL SELECT * FROM by_service) AS matches
       GROUP BY id
     )
     SELECT ${SUMMARY_COLUMNS},
            coalesce((SELECT max(score) FROM by_service)
                       >= coalesce((SELECT max(score) FROM by_name), 0), false) AS service_match
     FROM scored
     JOIN establishment e ON e.id = scored.id AND e.status = 'active'
     ${SUMMARY_JOINS}
     ORDER BY coalesce(e.municipality_id IN (SELECT id FROM municipality_in_query), false) DESC,
              scored.score DESC,
              e.scope = 'general' DESC,
              e.name
     LIMIT $2`,
    [normalizedQuery, limit],
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
    `SELECT s.code, t.text AS label
     FROM sector s
     JOIN translation t ON t.target_table = 'sector' AND t.target_id = s.id
       AND t.field = 'label' AND t.language = 'fr'
     ORDER BY normalize_search(t.text)`,
  );
}

const DETAIL_COLUMNS = `
  ${SUMMARY_COLUMNS},
  coalesce((SELECT json_agg(json_build_object('id', s.id, 'code', s.code) ORDER BY s.code)
            FROM establishment_service es JOIN service s ON s.id = es.service_id
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
    `INSERT INTO establishment (name, raw_input, sector_id, municipality_input, status, source)
     SELECT $1, $1, s.id, $3, 'pending_review', 'user'
     FROM (SELECT NULL) AS one
     LEFT JOIN sector s ON s.code = $2
     WHERE $2::text IS NULL OR s.id IS NOT NULL
     RETURNING id`,
    [input.rawInput, input.sectorCode, input.municipalityInput],
  );
  if (!rows[0]) throw invalidInput("Unknown sector");
  return rows[0].id;
}

/**
 * Reads monthly_stats for one establishment, most recent month first. The view
 * has one row per service: they are added up here, and a month is published
 * only when it reaches the threshold.
 */
export async function findPublishedStats(
  establishmentId: string,
  minFeedbackCount: number,
): Promise<EstablishmentStats[]> {
  const rows = await query<{ month: string; feedback_count: number; avg_satisfaction: number }>(
    `SELECT to_char(month, 'YYYY-MM-DD') AS month,
            sum(feedback_count)::int AS feedback_count,
            round(sum(avg_satisfaction * feedback_count) / sum(feedback_count), 2)::float8
              AS avg_satisfaction
     FROM monthly_stats
     WHERE establishment_id = $1
     GROUP BY month
     HAVING sum(feedback_count) >= $2
     ORDER BY month DESC`,
    [establishmentId, minFeedbackCount],
  );
  return rows.map((row) => ({
    month: row.month,
    feedbackCount: row.feedback_count,
    avgSatisfaction: row.avg_satisfaction,
  }));
}
