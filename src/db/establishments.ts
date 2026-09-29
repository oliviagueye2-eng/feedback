/**
 * Data access for the registry (establishment, service, municipality, qr_code).
 */
import type { EstablishmentSearchResult, EstablishmentSummary } from "../domain/types";
import { query } from "./client";

export interface EstablishmentDetail extends EstablishmentSummary {
  services: { id: number; code: string }[];
}

export interface NewUserEstablishment {
  rawInput: string;
  typeId: number | null;
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
}

interface DetailRow extends SummaryRow {
  services: { id: number; code: string }[];
}

const toSummary = (row: SummaryRow): EstablishmentSummary => ({
  id: row.id,
  name: row.name,
  municipalityName: row.municipality_name,
  typeCode: row.type_code,
});

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
     SELECT e.id, e.name, m.name AS municipality_name, et.code AS type_code,
            coalesce((SELECT max(score) FROM by_service)
                       >= coalesce((SELECT max(score) FROM by_name), 0), false) AS service_match
     FROM scored
     JOIN establishment e ON e.id = scored.id AND e.status = 'active'
     LEFT JOIN municipality m ON m.id = e.municipality_id
     LEFT JOIN establishment_type et ON et.id = e.type_id
     ORDER BY coalesce(e.municipality_id IN (SELECT id FROM municipality_in_query), false) DESC,
              scored.score DESC,
              e.name
     LIMIT $2`,
    [normalizedQuery, limit],
  );
  return {
    matchType: rows[0]?.service_match ? "service" : "establishment",
    results: rows.map(toSummary),
  };
}

const DETAIL_COLUMNS = `
  e.id, e.name, m.name AS municipality_name, et.code AS type_code,
  coalesce((SELECT json_agg(json_build_object('id', s.id, 'code', s.code) ORDER BY s.code)
            FROM establishment_service es JOIN service s ON s.id = es.service_id
            WHERE es.establishment_id = e.id), '[]') AS services`;

const DETAIL_JOINS = `
  LEFT JOIN municipality m ON m.id = e.municipality_id
  LEFT JOIN establishment_type et ON et.id = e.type_id`;

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
    `INSERT INTO establishment (name, raw_input, type_id, municipality_input, status, source)
     VALUES ($1, $1, $2, $3, 'pending_review', 'user')
     RETURNING id`,
    [input.rawInput, input.typeId, input.municipalityInput],
  );
  return rows[0]!.id;
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
