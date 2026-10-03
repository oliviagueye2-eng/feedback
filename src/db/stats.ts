import { query } from "./client";

/**
 * Recomputes the published results. CONCURRENTLY keeps each view readable
 * during the refresh (it relies on the views' unique indexes).
 */
export async function refreshMonthlyStats(): Promise<void> {
  await query("REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats");
  await query("REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_answer_counts");
  await query("REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_topic_counts");
}

/** Number of published feedbacks of one month, and how many were satisfied or very satisfied. */
export interface MonthCount {
  /** "YYYY-MM-01" */
  month: string;
  feedbackCount: number;
  satisfiedCount: number;
}

/** Number of times an answer was chosen, over a period. */
export interface AnswerCount {
  questionCode: string;
  questionLabel: string | null;
  optionCode: string;
  optionLabel: string | null;
  count: number;
}

/** Number of « Bien » and « Pas bien » for a topic, over a period. */
export interface TopicCount {
  code: string;
  label: string | null;
  positive: number;
  negative: number;
}

/**
 * Feedbacks per month for one establishment (all services added up), from
 * the answers to the essential question: each published feedback has exactly one.
 * Months are "YYYY-MM-01", `from` included and `to` excluded.
 */
export async function findMonthCounts(establishmentId: string, from: string, to: string): Promise<MonthCount[]> {
  return query<MonthCount>(
    `SELECT to_char(c.month, 'YYYY-MM-DD') AS "month",
            sum(c.answer_count)::int AS "feedbackCount",
            (sum(c.answer_count) FILTER (WHERE ao.code IN ('VERY_SATISFIED', 'SATISFIED')))::int
              AS "satisfiedCount"
     FROM monthly_answer_counts c
     JOIN question q ON q.id = c.question_id
     JOIN answer_option ao ON ao.id = c.option_id
     WHERE c.establishment_id = $1 AND q.code = 'OVERALL_SATISFACTION'
       AND c.month >= $2::date AND c.month < $3::date
     GROUP BY c.month
     ORDER BY c.month`,
    [establishmentId, from, to],
  ).then((rows) => rows.map((r) => ({ ...r, satisfiedCount: r.satisfiedCount ?? 0 })));
}

/**
 * Every option of the given questions, in the options' order, with the number
 * of times it was chosen over the period (0 when never chosen).
 */
export async function findAnswerCounts(
  establishmentId: string,
  from: string,
  to: string,
  questionCodes: readonly string[],
): Promise<AnswerCount[]> {
  return query<AnswerCount>(
    `SELECT q.code AS "questionCode", qt.label AS "questionLabel",
            ao.code AS "optionCode", aot.label AS "optionLabel",
            coalesce(sum(c.answer_count), 0)::int AS "count"
     FROM question q
     JOIN answer_option ao ON ao.question_id = q.id
     LEFT JOIN monthly_answer_counts c ON c.option_id = ao.id AND c.establishment_id = $1
       AND c.month >= $2::date AND c.month < $3::date
     LEFT JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
     LEFT JOIN answer_option_translation aot ON aot.answer_option_id = ao.id AND aot.language = 'fr'
     WHERE q.code = ANY($4::text[])
     GROUP BY q.code, qt.label, ao.code, aot.label, ao.position
     ORDER BY q.code, ao.position`,
    [establishmentId, from, to, questionCodes],
  );
}

/**
 * The establishment whose results are read: a merged one is followed to its
 * replacement (the views count its feedbacks there). Null when unknown.
 */
export async function findResultsEstablishment(id: string): Promise<{ id: string; status: string } | null> {
  const rows = await query<{ id: string; status: string }>(
    `SELECT e.id, e.status
     FROM establishment requested
     JOIN establishment e ON e.id = coalesce(requested.merged_into_id, requested.id)
     WHERE requested.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/** « Bien » and « Pas bien » per topic over the period (active topics only). */
export async function findTopicCounts(establishmentId: string, from: string, to: string): Promise<TopicCount[]> {
  return query<TopicCount>(
    `SELECT t.code, tt.label,
            sum(c.positive_count)::int AS "positive",
            sum(c.negative_count)::int AS "negative"
     FROM monthly_topic_counts c
     JOIN topic t ON t.id = c.topic_id
     LEFT JOIN topic_translation tt ON tt.topic_id = t.id AND tt.language = 'fr'
     WHERE c.establishment_id = $1 AND c.month >= $2::date AND c.month < $3::date AND t.is_active
     GROUP BY t.code, tt.label, t.position
     ORDER BY t.position`,
    [establishmentId, from, to],
  );
}

/** Codes of the questions of one evaluation category (migration 0009), oldest first. */
export async function findQuestionCodesOfCategory(categoryCode: string): Promise<string[]> {
  const rows = await query<{ code: string }>(
    `SELECT q.code
     FROM question q
     JOIN evaluation_category c ON c.id = q.category_id
     WHERE c.code = $1
     ORDER BY q.id`,
    [categoryCode],
  );
  return rows.map((r) => r.code);
}
