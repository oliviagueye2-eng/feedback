/**
 * Data access for collection tables (feedback, answer, feedback_topic, comment).
 * Every write is an upsert keyed on ids chosen by the phone, so that a request
 * sent twice after a network cut gives the same result.
 */
import { invalidInput, notFound } from "../domain/errors";
import type { QuestionCondition } from "../domain/questionnaire/conditions";
import type { QuestionnaireSources, SelectedQuestionnaire } from "../domain/questionnaire/select";
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
 * in the detailed questionnaire chosen for this feedback, then in COMMON. The first detailed
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
  // Looked up in ESSENTIAL, then the detailed questionnaire, then COMMON.
  const questions = await query<{ id: number; questionnaire_id: number; type: string; is_detailed: boolean }>(
    `SELECT q.id, q.questionnaire_id, q.type,
            q.questionnaire_id IS NOT DISTINCT FROM ${detailedId} AS is_detailed
     FROM question q
     WHERE q.code = $1
       AND q.questionnaire_id IN (${PUBLISHED("ESSENTIAL")}, ${detailedId}, ${PUBLISHED("COMMON")})
     ORDER BY q.questionnaire_id = ${PUBLISHED("ESSENTIAL")} DESC, is_detailed DESC
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

  // Only the sector's (or service's) questionnaire is recorded, not COMMON.
  if (question.is_detailed) {
    await query(
      `UPDATE feedback SET detailed_questionnaire_id = $2
       WHERE id = $1 AND detailed_questionnaire_id IS NULL`,
      [input.feedbackId, question.questionnaire_id],
    );
  }
}

/**
 * Active topics shown for feedback $1: the common ones (no row in
 * topic_sector) and those of its sector. The sector is the visit reason's,
 * else the establishment type's, else the establishment's.
 */
const TOPICS_FOR_FEEDBACK = `
  SELECT t.* FROM topic t
  WHERE t.is_active
    AND (NOT EXISTS (SELECT 1 FROM topic_sector ts WHERE ts.topic_id = t.id)
         OR EXISTS (
           SELECT 1 FROM topic_sector ts, feedback f
           JOIN establishment e ON e.id = f.establishment_id
           LEFT JOIN service s ON s.id = f.service_id
           LEFT JOIN establishment_type et ON et.id = e.type_id
           WHERE f.id = $1 AND ts.topic_id = t.id
             AND ts.sector_id = coalesce(s.sector_id, et.sector_id, e.sector_id)))`;

/**
 * Replaces all topics of a feedback. Codes must be unique (checked in src/domain).
 * A topic that is not (or no longer) offered for this feedback is ignored, the
 * others are kept: e.g. screen 2b shown again from the phone's memory after
 * the visit reason moved the feedback to another sector, or a topic turned off
 * in between. The user sees no error for it.
 */
export async function replaceTopics(input: {
  feedbackId: string;
  topics: { code: string; sentiment: TopicSentiment; otherText: string | null }[];
}): Promise<void> {
  const known = new Set(
    (
      await query<{ code: string }>(
        `SELECT code FROM (${TOPICS_FOR_FEEDBACK}) t WHERE code = ANY($2::text[])`,
        [input.feedbackId, input.topics.map((t) => t.code)],
      )
    ).map((row) => row.code),
  );
  const topics = input.topics.filter((t) => known.has(t.code));
  const codes = topics.map((t) => t.code);

  // One statement: removes the topics no longer touched, then upserts the others.
  await query(
    `WITH wanted AS (
       SELECT t.id, x.sentiment, x.other_text
       FROM unnest($2::text[], $3::text[], $4::text[]) AS x (code, sentiment, other_text)
       JOIN topic t ON t.code = x.code
     ),
     removed AS (
       DELETE FROM feedback_topic
       WHERE feedback_id = $1 AND topic_id NOT IN (SELECT id FROM wanted)
     )
     INSERT INTO feedback_topic (feedback_id, topic_id, sentiment, other_text)
     SELECT $1, id, sentiment, other_text FROM wanted
     ON CONFLICT (feedback_id, topic_id) DO UPDATE SET
       sentiment = EXCLUDED.sentiment,
       other_text = EXCLUDED.other_text`,
    [input.feedbackId, codes, topics.map((t) => t.sentiment), topics.map((t) => t.otherText)],
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

/** The user emptied the free text: the comment goes. */
export async function deleteComment(feedbackId: string): Promise<void> {
  await query("DELETE FROM comment WHERE feedback_id = $1", [feedbackId]);
}

/** « Bien » or « Pas bien », for one topic of screen 2b. */
export type TopicSentiment = "positive" | "negative";

export interface TopicChoice {
  code: string;
  label: string;
  /** What the user touched for this topic, null when nothing. */
  sentiment: TopicSentiment | null;
  /** Only for "Autre": what the user wrote. */
  otherText: string | null;
}

/** Screen 2b: the topics to show, in order, with what the user already touched. */
export async function findTopicChoices(feedbackId: string): Promise<TopicChoice[]> {
  const rows = await query<{ code: string; label: string; sentiment: TopicSentiment | null; other_text: string | null }>(
    `SELECT t.code, tr.label, ft.sentiment, ft.other_text
     FROM (${TOPICS_FOR_FEEDBACK}) t
     JOIN topic_translation tr ON tr.topic_id = t.id AND tr.language = 'fr'
     LEFT JOIN feedback_topic ft ON ft.feedback_id = $1 AND ft.topic_id = t.id
     ORDER BY t.position`,
    [feedbackId],
  );
  return rows.map((r) => ({ code: r.code, label: r.label, sentiment: r.sentiment, otherText: r.other_text }));
}

/** Screen 2b: the free text already written, to show it when coming back. */
export async function findCommentText(feedbackId: string): Promise<string | null> {
  const rows = await query<{ text: string }>("SELECT text FROM comment WHERE feedback_id = $1", [feedbackId]);
  return rows[0]?.text ?? null;
}

/**
 * Where to find the detailed questionnaire: the feedback's service, else the
 * establishment's type, else its sector (the service's, the establishment
 * type's, or the one the user chose). Only published questionnaires count.
 */
export async function findQuestionnaireSources(feedbackId: string): Promise<QuestionnaireSources | null> {
  const rows = await query<{ service_q: number | null; type_q: number | null; sector_q: number | null }>(
    `SELECT sq.id AS service_q, tq.id AS type_q, fq.id AS sector_q
     FROM feedback f
     JOIN establishment e ON e.id = f.establishment_id
     LEFT JOIN service s ON s.id = f.service_id
     LEFT JOIN establishment_type et ON et.id = e.type_id
     LEFT JOIN sector sec ON sec.id = coalesce(s.sector_id, et.sector_id, e.sector_id)
     LEFT JOIN questionnaire sq ON sq.id = s.detailed_questionnaire_id AND sq.status = 'published'
     LEFT JOIN questionnaire tq ON tq.id = et.detailed_questionnaire_id AND tq.status = 'published'
     LEFT JOIN questionnaire fq ON fq.id = sec.fallback_questionnaire_id AND fq.status = 'published'
     WHERE f.id = $1`,
    [feedbackId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    serviceQuestionnaireId: row.service_q,
    typeQuestionnaireId: row.type_q,
    sectorFallbackQuestionnaireId: row.sector_q,
  };
}

export interface FeedbackContext {
  establishmentId: string;
  establishmentName: string;
  channel: "qr" | "search" | "link";
  /** Code of the QR code scanned, to go back to its screen 1 (/e/{code}). */
  qrCode: string | null;
  /** Visit reason and period chosen at screen 1 (coming back to change them). */
  serviceId: number | null;
  visitPeriod: string | null;
  scope: "site" | "general";
  /** French label of the visit reason, when one was chosen. */
  serviceLabel: string | null;
  /** Option already chosen at the essential question (coming back to change it). */
  essentialOption: string | null;
  /** Feedback complete (screen 7 reached). */
  completed: boolean;
}

/** What the screens after screen 1 show about the feedback being given. */
export async function findFeedbackContext(feedbackId: string): Promise<FeedbackContext | null> {
  const rows = await query<{
    establishment_id: string;
    establishment_name: string;
    scope: "site" | "general";
    channel: "qr" | "search" | "link";
    qr_code: string | null;
    service_id: number | null;
    visit_period: string | null;
    service_label: string | null;
    essential_option: string | null;
    completed: boolean;
  }>(
    `SELECT e.id AS establishment_id, e.name AS establishment_name, e.scope, f.channel,
            qc.code AS qr_code, f.service_id, f.visit_period, st.label AS service_label,
            f.step = 'completed' AS completed,
            (SELECT ao.code
             FROM answer a
             JOIN question q ON q.id = a.question_id
             JOIN answer_option ao ON ao.id = a.option_id
             WHERE a.feedback_id = f.id AND q.code = 'OVERALL_SATISFACTION') AS essential_option
     FROM feedback f
     JOIN establishment e ON e.id = f.establishment_id
     LEFT JOIN qr_code qc ON qc.id = f.qr_code_id
     LEFT JOIN service_translation st ON st.service_id = f.service_id AND st.language = 'fr'
     WHERE f.id = $1`,
    [feedbackId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name,
    channel: row.channel,
    qrCode: row.qr_code,
    serviceId: row.service_id,
    visitPeriod: row.visit_period,
    scope: row.scope,
    serviceLabel: row.service_label,
    essentialOption: row.essential_option,
    completed: row.completed,
  };
}

export interface EssentialQuestion {
  label: string;
  options: { code: string; label: string; followUpPrompt: string | null }[];
}

/** Screen 2: the essential question of the published questionnaire, in French. */
export async function findEssentialQuestion(): Promise<EssentialQuestion | null> {
  const rows = await query<{ question: string; code: string; label: string; prompt: string | null }>(
    `SELECT qt.label AS question, ao.code, ot.label, ot.follow_up_prompt AS prompt
     FROM question q
     JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
     JOIN answer_option ao ON ao.question_id = q.id
     JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
     WHERE q.code = 'OVERALL_SATISFACTION' AND q.questionnaire_id = ${PUBLISHED("ESSENTIAL")}
     ORDER BY ao.position`,
  );
  if (rows.length === 0) return null;
  return {
    label: rows[0]!.question,
    options: rows.map((r) => ({ code: r.code, label: r.label, followUpPrompt: r.prompt })),
  };
}

/**
 * The feedback is complete. Only once the essential question is answered;
 * completed_at is rounded to the hour, like started_at, and kept when the
 * last screen is sent again. False when there is no such feedback.
 */
export async function completeFeedback(feedbackId: string): Promise<boolean> {
  const rows = await query(
    `UPDATE feedback f
     SET step = 'completed', completed_at = coalesce(f.completed_at, date_trunc('hour', now()))
     WHERE f.id = $1 AND EXISTS (
       SELECT 1 FROM answer a JOIN question q ON q.id = a.question_id
       WHERE a.feedback_id = f.id AND q.code = 'OVERALL_SATISFACTION')
     RETURNING f.id`,
    [feedbackId],
  );
  return rows.length > 0;
}

/**
 * Nightly cleanup: feedbacks started more than `days` days ago and never
 * answered at the essential question (left at screen 1). Their topics,
 * comment and answers go with them (none in practice: screen 2b needs the
 * essential answer). Returns how many were deleted.
 */
export async function deleteAbandonedFeedbacks(days: number): Promise<number> {
  const rows = await query(
    `WITH abandoned AS (
       SELECT f.id FROM feedback f
       WHERE f.started_at < now() - make_interval(days => $1)
         AND NOT EXISTS (
           SELECT 1 FROM answer a JOIN question q ON q.id = a.question_id
           WHERE a.feedback_id = f.id AND q.code = 'OVERALL_SATISFACTION')
     ),
     topics AS (DELETE FROM feedback_topic WHERE feedback_id IN (SELECT id FROM abandoned)),
     comments AS (DELETE FROM comment WHERE feedback_id IN (SELECT id FROM abandoned)),
     answers AS (DELETE FROM answer WHERE feedback_id IN (SELECT id FROM abandoned))
     DELETE FROM feedback WHERE id IN (SELECT id FROM abandoned)
     RETURNING id`,
    [days],
  );
  return rows.length;
}

export interface DetailedQuestion {
  id: number;
  code: string;
  type: string;
  label: string;
  options: { code: string; label: string }[];
  /** Option already chosen for this feedback (coming back to the page). */
  chosen: string | null;
  /** Shown only if the question it depends on got one of these answers. */
  conditions: QuestionCondition[];
  /** A common question (questionnaire COMMON), shown on its own page. */
  common: boolean;
}

/**
 * Screens 6 and 6b: the questions of the chosen detailed questionnaire, then
 * the common ones (questionnaire COMMON, linked to no sector: always loaded), in
 * French and in order, with what this feedback already answered and their
 * conditions. Only questions with options (no free text for now).
 */
export async function findDetailedQuestions(
  feedbackId: string,
  selected: SelectedQuestionnaire,
): Promise<DetailedQuestion[]> {
  const generic = selected.kind === "generic";
  // The questions of the page; $n is the detailed questionnaire's id (unless GENERIC).
  const pageQuestions = (n: number) =>
    `q.questionnaire_id IN (${generic ? PUBLISHED(selected.code) : `$${n}::int`}, ${PUBLISHED("COMMON")})`;
  const questionnaireParam = generic ? [] : [selected.id];
  const [rows, conditions] = await Promise.all([
    query<{
      id: number;
      code: string;
      type: string;
      label: string;
      option_code: string;
      option_label: string;
      chosen: boolean;
      common: boolean;
    }>(
      `SELECT q.id, q.code, q.type, qt.label, ao.code AS option_code, ot.label AS option_label,
              q.questionnaire_id = ${PUBLISHED("COMMON")} AS common,
              EXISTS (SELECT 1 FROM answer a WHERE a.feedback_id = $1 AND a.option_id = ao.id) AS chosen
       FROM question q
       JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
       JOIN answer_option ao ON ao.question_id = q.id
       JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
       WHERE ${pageQuestions(2)}
       ORDER BY q.questionnaire_id = ${PUBLISHED("COMMON")}, q.position, ao.position`,
      [feedbackId, ...questionnaireParam],
    ),
    query<{ code: string; depends_on: string; option_code: string }>(
      `SELECT q.code, dq.code AS depends_on, ao.code AS option_code
       FROM question_condition qc
       JOIN question q ON q.id = qc.question_id
       JOIN question dq ON dq.id = qc.depends_on_question_id
       JOIN answer_option ao ON ao.id = qc.option_id
       WHERE ${pageQuestions(1)}
       ORDER BY dq.code, ao.position`,
      questionnaireParam,
    ),
  ]);
  const questions: DetailedQuestion[] = [];
  for (const row of rows) {
    let question = questions.at(-1);
    if (question?.code !== row.code) {
      question = {
        id: row.id,
        code: row.code,
        type: row.type,
        label: row.label,
        options: [],
        chosen: null,
        conditions: [],
        common: row.common,
      };
      questions.push(question);
    }
    question.options.push({ code: row.option_code, label: row.option_label });
    if (row.chosen) question.chosen = row.option_code;
  }
  for (const row of conditions) {
    const question = questions.find((q) => q.code === row.code);
    if (!question) continue;
    let condition = question.conditions.find((c) => c.dependsOn === row.depends_on);
    if (!condition) {
      condition = { dependsOn: row.depends_on, options: [] };
      question.conditions.push(condition);
    }
    condition.options.push(row.option_code);
  }
  return questions;
}

/** Removes this feedback's answers to these questions (answers that no longer apply). */
export async function deleteAnswers(feedbackId: string, questionIds: number[]): Promise<void> {
  if (questionIds.length === 0) return;
  await query("DELETE FROM answer WHERE feedback_id = $1 AND question_id = ANY($2::int[])", [feedbackId, questionIds]);
}
