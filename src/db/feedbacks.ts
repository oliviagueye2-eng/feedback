/**
 * Data access for collection tables (feedback, answer, feedback_topic, comment).
 * Every write is an upsert keyed on ids chosen by the phone, so that a request
 * sent twice after a network cut gives the same result.
 */
import { invalidInput, notFound } from "../domain/errors";
import type { SelectedQuestionnaire } from "../domain/questionnaire/select";
import type { Channel, VisitPeriod } from "../domain/types";
import { query } from "./client";

export interface FeedbackRow {
  id: string;
  establishmentId: string;
  serviceId: number | null;
  qrCodeId: string | null;
  channel: Channel;
  language: string;
  visitPeriod: VisitPeriod | null;
  visitMonth: string | null;
  startedAt: Date;
}

/** Latest published version of a questionnaire, found by its code. */
const PUBLISHED = (code: string) => `(
  SELECT id FROM questionnaire
  WHERE code = '${code}' AND status = 'published'
  ORDER BY version DESC LIMIT 1)`;

/**
 * Only establishments that accept feedback (active or pending review).
 * started_at never changes, and visit_month only when the user changes their
 * answer to "Quand êtes-vous venu(e) ?": a retry the next month keeps the month.
 */
export async function upsertFeedback(row: FeedbackRow): Promise<void> {
  const rows = await query(
    `INSERT INTO feedback AS f (id, establishment_id, service_id, qr_code_id, channel,
                                language, visit_period, visit_month, started_at)
     SELECT $1, e.id, $3, $4, $5, $6, $7, $8, $9
     FROM establishment e
     WHERE e.id = $2 AND e.status IN ('active', 'pending_review')
     ON CONFLICT (id) DO UPDATE SET
       establishment_id = EXCLUDED.establishment_id,
       service_id = EXCLUDED.service_id,
       qr_code_id = EXCLUDED.qr_code_id,
       channel = EXCLUDED.channel,
       language = EXCLUDED.language,
       visit_month = CASE WHEN f.visit_period IS DISTINCT FROM EXCLUDED.visit_period
                          THEN EXCLUDED.visit_month ELSE f.visit_month END,
       visit_period = EXCLUDED.visit_period
     RETURNING f.id`,
    [
      row.id,
      row.establishmentId,
      row.serviceId,
      row.qrCodeId,
      row.channel,
      row.language,
      row.visitPeriod,
      row.visitMonth,
      row.startedAt,
    ],
  );
  if (rows.length === 0) throw notFound("Establishment not found or not accepting feedback");
}

/**
 * The question is looked up by its code in the essential questionnaire, then
 * in the detailed questionnaire chosen for this feedback. The first detailed
 * answer records which questionnaire was used (feedback.detailed_questionnaire_id).
 */
export async function upsertAnswer(input: {
  feedbackId: string;
  questionCode: string;
  optionCode: string | null;
  textValue: string | null;
  detailed: SelectedQuestionnaire;
}): Promise<void> {
  const detailedId = input.detailed.kind === "generic" ? PUBLISHED("GENERIC") : "$2::int";
  const questions = await query<{ id: number; questionnaire_id: number; type: string; is_essential: boolean }>(
    `SELECT q.id, q.questionnaire_id, q.type, q.questionnaire_id = ${PUBLISHED("ESSENTIAL")} AS is_essential
     FROM question q
     WHERE q.code = $1 AND q.questionnaire_id IN (${PUBLISHED("ESSENTIAL")}, ${detailedId})
     ORDER BY is_essential DESC
     LIMIT 1`,
    input.detailed.kind === "generic" ? [input.questionCode] : [input.questionCode, input.detailed.id],
  );
  const question = questions[0];
  if (!question) throw notFound("Question not found");

  let optionId: number | null = null;
  if (question.type === "text") {
    if (!input.textValue) throw invalidInput("text is required for this question");
  } else {
    if (!input.optionCode) throw invalidInput("option is required for this question");
    const options = await query<{ id: number }>(
      "SELECT id FROM answer_option WHERE question_id = $1 AND code = $2",
      [question.id, input.optionCode],
    );
    if (!options[0]) throw invalidInput("Unknown option for this question");
    optionId = options[0].id;
  }

  await query(
    `INSERT INTO answer (feedback_id, question_id, option_id, text_value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (feedback_id, question_id) DO UPDATE SET
       option_id = EXCLUDED.option_id,
       text_value = EXCLUDED.text_value,
       answered_at = now()`,
    [input.feedbackId, question.id, optionId, question.type === "text" ? input.textValue : null],
  );

  if (!question.is_essential) {
    await query(
      `UPDATE feedback SET detailed_questionnaire_id = $2
       WHERE id = $1 AND detailed_questionnaire_id IS NULL`,
      [input.feedbackId, question.questionnaire_id],
    );
  }
}

/** Replaces all topics of a feedback. Codes must be unique (checked in src/domain). */
export async function replaceTopics(input: {
  feedbackId: string;
  topics: { code: string; otherText: string | null }[];
}): Promise<void> {
  const codes = input.topics.map((t) => t.code);
  const known = await query<{ code: string }>(
    "SELECT code FROM topic WHERE is_active AND code = ANY($1::text[])",
    [codes],
  );
  if (known.length !== codes.length) throw invalidInput("Unknown topic");

  // One statement: removes the topics no longer checked, then upserts the others.
  await query(
    `WITH wanted AS (
       SELECT t.id, x.other_text
       FROM unnest($2::text[], $3::text[]) AS x (code, other_text)
       JOIN topic t ON t.code = x.code
     ),
     removed AS (
       DELETE FROM feedback_topic
       WHERE feedback_id = $1 AND topic_id NOT IN (SELECT id FROM wanted)
     )
     INSERT INTO feedback_topic (feedback_id, topic_id, other_text)
     SELECT $1, id, other_text FROM wanted
     ON CONFLICT (feedback_id, topic_id) DO UPDATE SET other_text = EXCLUDED.other_text`,
    [input.feedbackId, codes, input.topics.map((t) => t.otherText)],
  );
}

/**
 * promptOptionCode is an option of the essential question. Editing a comment
 * sends it back to moderation.
 */
export async function upsertComment(input: {
  feedbackId: string;
  text: string;
  promptOptionCode: string;
}): Promise<void> {
  const rows = await query(
    `INSERT INTO comment (feedback_id, prompt_option_id, text)
     SELECT $1, ao.id, $3
     FROM answer_option ao
     JOIN question q ON q.id = ao.question_id
     WHERE q.code = 'OVERALL_SATISFACTION' AND q.questionnaire_id = ${PUBLISHED("ESSENTIAL")}
       AND ao.code = $2
     ON CONFLICT (feedback_id) DO UPDATE SET
       prompt_option_id = EXCLUDED.prompt_option_id,
       text = EXCLUDED.text,
       status = 'pending',
       hidden_reason = NULL
     RETURNING feedback_id`,
    [input.feedbackId, input.promptOptionCode, input.text],
  );
  if (rows.length === 0) throw invalidInput("Unknown promptOption");
}

/**
 * Where to find the detailed questionnaire: the feedback's service, else its
 * sector (the service's, or the establishment type's). Only published
 * questionnaires count.
 */
export async function findQuestionnaireSources(feedbackId: string): Promise<{
  serviceQuestionnaireId: number | null;
  sectorFallbackQuestionnaireId: number | null;
} | null> {
  const rows = await query<{ service_q: number | null; sector_q: number | null }>(
    `SELECT sq.id AS service_q, fq.id AS sector_q
     FROM feedback f
     JOIN establishment e ON e.id = f.establishment_id
     LEFT JOIN service s ON s.id = f.service_id
     LEFT JOIN establishment_type et ON et.id = e.type_id
     LEFT JOIN sector sec ON sec.id = coalesce(s.sector_id, et.sector_id)
     LEFT JOIN questionnaire sq ON sq.id = s.detailed_questionnaire_id AND sq.status = 'published'
     LEFT JOIN questionnaire fq ON fq.id = sec.fallback_questionnaire_id AND fq.status = 'published'
     WHERE f.id = $1`,
    [feedbackId],
  );
  const row = rows[0];
  if (!row) return null;
  return { serviceQuestionnaireId: row.service_q, sectorFallbackQuestionnaireId: row.sector_q };
}
