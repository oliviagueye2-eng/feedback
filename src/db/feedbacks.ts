/**
 * Data access for collection tables (feedback, answer, feedback_topic, comment).
 * Every write is an upsert keyed on ids chosen by the phone, so that a request
 * sent twice after a network cut gives the same result.
 */
import { invalidInput, notFound } from "../domain/errors";
import type { QuestionCondition } from "../domain/questionnaire/conditions";
import type { QuestionSetSources } from "../domain/questionnaire/select";
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

/** A special list of questions, found by its code (ESSENTIAL, COMMON, COMMERCE). */
const QUESTION_SET = (code: "ESSENTIAL" | "COMMON" | "COMMERCE") =>
  `(SELECT id FROM question_set WHERE code = '${code}')`;

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
 * Saves one answer. The question is looked up by its code among the questions
 * this feedback may answer: the lists of its page (setIds: sector, type,
 * service), the essential question, the common ones, and the questions that
 * open a topic of its screen 2b (« Avez-vous payé quelque chose ? »).
 * Inactive options (« Je n'ai rien payé » since 0011) are refused.
 */
export async function upsertAnswer(input: {
  feedbackId: string;
  questionCode: string;
  optionCode: string | null;
  textValue: string | null;
  setIds: number[];
}): Promise<void> {
  const questions = await query<{ id: number; type: string }>(
    `SELECT q.id, q.type
     FROM question q
     WHERE q.code = $1
       AND (EXISTS (SELECT 1 FROM question_set_item i
                    WHERE i.question_id = q.id
                      AND (i.question_set_id = ANY($2::smallint[])
                           OR i.question_set_id IN (${QUESTION_SET("ESSENTIAL")}, ${QUESTION_SET("COMMON")})))
            OR q.id IN (SELECT tc.depends_on_question_id
                        FROM (${topicsForFeedback("$3")}) t
                        JOIN topic_condition tc ON tc.topic_id = t.id))`,
    [input.questionCode, input.setIds, input.feedbackId],
  );
  const question = questions[0];
  if (!question) throw notFound("Question not found");

  let optionId: number | null = null;
  if (question.type === "text") {
    if (!input.textValue) throw invalidInput("text is required for this question");
  } else {
    if (!input.optionCode) throw invalidInput("option is required for this question");
    const options = await query<{ id: number }>(
      "SELECT id FROM answer_option WHERE question_id = $1 AND code = $2 AND is_active",
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
}

/** The lists of a level's row `alias` (0044: several per level), in their order, as an array. */
const listsOf = (level: "sector" | "establishment_type" | "service", owner: string, alias: string, kind: "topic" | "question") =>
  `ARRAY(SELECT x.${kind}_set_id FROM ${level}_${kind}_set x WHERE x.${owner} = ${alias}.id ORDER BY x.position)`;

/** The lists of the three levels (sec, et, s): sector_topic_sets, type_question_sets… */
const LEVEL_LISTS = `
  ${listsOf("sector", "sector_id", "sec", "topic")} AS sector_topic_sets,
  ${listsOf("sector", "sector_id", "sec", "question")} AS sector_question_sets,
  ${listsOf("establishment_type", "type_id", "et", "topic")} AS type_topic_sets,
  ${listsOf("establishment_type", "type_id", "et", "question")} AS type_question_sets,
  ${listsOf("service", "service_id", "s", "topic")} AS service_topic_sets,
  ${listsOf("service", "service_id", "s", "question")} AS service_question_sets`;

/**
 * The levels of feedback $n, as FORM_LEVELS gives them: its service, the
 * sector of the establishment (its type's, else its own; never the
 * service's, decided by Olivia, 2026-10-08), its establishment type.
 */
const feedbackLevels = (feedbackParam: string) => `
  SELECT s.replaces_shared_lists AS replaces, sec.id AS sector_id, ${LEVEL_LISTS}
  FROM feedback f
  JOIN establishment e ON e.id = f.establishment_id
  LEFT JOIN service s ON s.id = f.service_id
  LEFT JOIN establishment_type et ON et.id = e.type_id
  LEFT JOIN sector sec ON sec.id = coalesce(et.sector_id, e.sector_id)
  WHERE f.id = ${feedbackParam}`;

/**
 * The same levels without a feedback, by their codes ($n: sector, $n+1:
 * establishment type, $n+2: service; null for none): the form a feedback
 * would get, shown in the back office (asked by Olivia, 2026-10-08).
 */
const formLevels = (first: number) => `
  SELECT s.replaces_shared_lists AS replaces, sec.id AS sector_id, ${LEVEL_LISTS}
  FROM (SELECT 1) one
  LEFT JOIN sector sec ON sec.code = $${first}
  LEFT JOIN establishment_type et ON et.code = $${first + 1}
  LEFT JOIN service s ON s.code = $${first + 2}`;

/**
 * The topic lists of the levels given (a feedback's, or a form's), one row
 * per list (level, id): COMMON, then the lists of its sector (COMMERCE when
 * the sector is unknown), of its establishment type and of its service. A
 * service that replaces the shared lists (mobile money, 0026) leaves out
 * COMMON and the sector's.
 */
const topicListsOfLevels = (levels: string) => `
  SELECT v.level, v.id
  FROM (${levels}) l,
       LATERAL (
         SELECT 'common', id FROM topic_set WHERE code = 'COMMON' AND NOT coalesce(l.replaces, false)
         UNION ALL
         SELECT 'sector', unnest(CASE WHEN l.replaces THEN '{}'::smallint[]
                                      WHEN l.sector_id IS NULL THEN ARRAY(SELECT id FROM topic_set WHERE code = 'COMMERCE')
                                      ELSE l.sector_topic_sets END)
         UNION ALL
         SELECT 'type', unnest(l.type_topic_sets)
         UNION ALL
         SELECT 'service', unnest(l.service_topic_sets)) AS v (level, id)`;

/** Active topics shown for the levels given: those of their lists (topicListsOfLevels), each once. */
const topicsOfLevels = (levels: string) => `
  SELECT t.* FROM topic t
  WHERE t.is_active
    AND EXISTS (
      SELECT 1
      FROM (${topicListsOfLevels(levels)}) ls
      JOIN topic_set_item i ON i.topic_set_id = ls.id
      WHERE i.topic_id = t.id)`;

/** Active topics shown for feedback $n (topicsOfLevels). */
const topicsForFeedback = (feedbackParam: string) => topicsOfLevels(feedbackLevels(feedbackParam));

/**
 * Replaces all topics of a feedback. Codes must be unique (checked in src/domain).
 * A topic that is not (or no longer) offered for this feedback is ignored, the
 * others are kept: e.g. screen 2b shown again from the phone's memory after
 * the visit reason moved the feedback to another sector, or a topic turned off
 * in between. So is a topic whose question did not get the answer that opens
 * it (hidden on the screen, e.g. « Frais payés » after « Non » to « Avez-vous
 * payé quelque chose ? »): save the answers of screen 2b first. The user sees
 * no error for it.
 */
export async function replaceTopics(input: {
  feedbackId: string;
  topics: { code: string; sentiment: TopicSentiment; otherText: string | null }[];
}): Promise<void> {
  const known = new Set(
    (
      await query<{ code: string }>(
        `SELECT t.code FROM (${topicsForFeedback("$1")}) t
         WHERE t.code = ANY($2::text[])
           AND NOT EXISTS (
             SELECT 1 FROM topic_condition tc
             WHERE tc.topic_id = t.id
               AND NOT EXISTS (
                 SELECT 1 FROM answer a
                 JOIN topic_condition ok ON ok.topic_id = t.id AND ok.option_id = a.option_id
                 WHERE a.feedback_id = $1 AND a.question_id = tc.depends_on_question_id))`,
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
     WHERE q.code = 'OVERALL_SATISFACTION' AND ao.code = $2
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

/** « Bien », « Pas bien » or « Non concerné », for one topic of screen 2b. */
export type TopicSentiment = "positive" | "negative" | "not_concerned";

/** The yes/no question asked in the place of a topic, which shows it after « Oui ». */
export interface TopicGate {
  code: string;
  label: string;
  options: { code: string; label: string }[];
  /** The answers that show the topic. */
  opensWith: string[];
  /** What this feedback answered, null when nothing. */
  chosen: string | null;
}

export interface TopicChoice {
  code: string;
  label: string;
  /** What the user touched for this topic, null when nothing. */
  sentiment: TopicSentiment | null;
  /** Only for "Autre": what the user wrote. */
  otherText: string | null;
  /** Shown only after an answer to this question; null when always shown. */
  gate: TopicGate | null;
  /** French label of its evaluation category (a title above its topics); null when none. */
  category: string | null;
}

/** Screen 2b: the topics to show, in order, with what the user already touched. */
export async function findTopicChoices(feedbackId: string): Promise<TopicChoice[]> {
  return topicChoices(topicsForFeedback("$1"), [feedbackId]);
}

/** No feedback: nothing touched nor answered (a form shown in the back office). */
const NO_FEEDBACK = "00000000-0000-0000-0000-000000000000";

/** The form's levels, by their codes (null for none): sector, establishment type, service. */
export interface FormLevels {
  sector: string | null;
  type: string | null;
  service: string | null;
}

/** Screen 2b of a form (back office): its topics, in order, as a feedback with these levels gets them. */
export async function findFormTopicChoices(levels: FormLevels): Promise<TopicChoice[]> {
  return topicChoices(topicsOfLevels(formLevels(2)), [NO_FEEDBACK, levels.sector, levels.type, levels.service]);
}

/** The topics of `topics` (SQL; $1: the feedback whose choices to show), in order. */
async function topicChoices(topics: string, params: unknown[]): Promise<TopicChoice[]> {
  const [rows, gates] = await Promise.all([
    query<{
      code: string;
      label: string;
      sentiment: TopicSentiment | null;
      other_text: string | null;
      category: string | null;
    }>(
      `SELECT t.code, tr.label, ft.sentiment, ft.other_text, ct.label AS category
       FROM (${topics}) t
       JOIN topic_translation tr ON tr.topic_id = t.id AND tr.language = 'fr'
       LEFT JOIN evaluation_category_translation ct ON ct.evaluation_category_id = t.category_id AND ct.language = 'fr'
       LEFT JOIN feedback_topic ft ON ft.feedback_id = $1 AND ft.topic_id = t.id
       LEFT JOIN evaluation_category c ON c.id = t.category_id
       ORDER BY c.position NULLS LAST, t.position`,
      params,
    ),
    query<{
      topic: string;
      code: string;
      label: string;
      option_code: string;
      option_label: string;
      opens: boolean;
      chosen: boolean;
    }>(
      `SELECT t.code AS topic, q.code, qt.label, ao.code AS option_code, ot.label AS option_label,
              EXISTS (SELECT 1 FROM topic_condition ok WHERE ok.topic_id = t.id AND ok.option_id = ao.id) AS opens,
              EXISTS (SELECT 1 FROM answer a WHERE a.feedback_id = $1 AND a.option_id = ao.id) AS chosen
       FROM (${topics}) t
       JOIN (SELECT DISTINCT topic_id, depends_on_question_id FROM topic_condition) tc ON tc.topic_id = t.id
       JOIN question q ON q.id = tc.depends_on_question_id
       JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
       JOIN answer_option ao ON ao.question_id = q.id AND ao.is_active
       JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
       ORDER BY t.code, ao.position`,
      params,
    ),
  ]);
  const gateOf = new Map<string, TopicGate>();
  for (const row of gates) {
    let gate = gateOf.get(row.topic);
    if (!gate) {
      gate = { code: row.code, label: row.label, options: [], opensWith: [], chosen: null };
      gateOf.set(row.topic, gate);
    }
    gate.options.push({ code: row.option_code, label: row.option_label });
    if (row.opens) gate.opensWith.push(row.option_code);
    if (row.chosen) gate.chosen = row.option_code;
  }
  return rows.map((r) => ({
    code: r.code,
    label: r.label,
    sentiment: r.sentiment,
    otherText: r.other_text,
    gate: gateOf.get(r.code) ?? null,
    category: r.category,
  }));
}

/** Screen 2b: the free text already written, to show it when coming back. */
export async function findCommentText(feedbackId: string): Promise<string | null> {
  const rows = await query<{ text: string }>("SELECT text FROM comment WHERE feedback_id = $1", [feedbackId]);
  return rows[0]?.text ?? null;
}

/**
 * The lists of questions attached to the feedback's levels: its sector (the
 * establishment type's, else the establishment's; never the service's), its
 * establishment type and its service; and COMMERCE, for a sector unknown.
 * A service that replaces the shared lists (0026) leaves the sector's out.
 */
export async function findQuestionSetSources(feedbackId: string): Promise<QuestionSetSources | null> {
  return questionSetSources(feedbackLevels("$1"), [feedbackId]);
}

/** The lists of questions of a form (back office), as a feedback with these levels gets them. */
export async function findFormQuestionSetSources(levels: FormLevels): Promise<QuestionSetSources> {
  return (await questionSetSources(formLevels(1), [levels.sector, levels.type, levels.service]))!;
}

async function questionSetSources(levels: string, params: unknown[]): Promise<QuestionSetSources | null> {
  const rows = await query<{
    sector_known: boolean;
    sector_sets: number[];
    type_sets: number[];
    service_sets: number[];
    commerce_set: number | null;
  }>(
    `SELECT l.sector_id IS NOT NULL AS sector_known,
            CASE WHEN l.replaces THEN '{}'::smallint[] ELSE l.sector_question_sets END AS sector_sets,
            l.type_question_sets AS type_sets, l.service_question_sets AS service_sets,
            ${QUESTION_SET("COMMERCE")} AS commerce_set
     FROM (${levels}) l`,
    params,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    sectorKnown: row.sector_known,
    sectorSetIds: row.sector_sets,
    typeSetIds: row.type_sets,
    serviceSetIds: row.service_sets,
    commerceSetId: row.commerce_set,
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

/** Screen 2: the essential question (list ESSENTIAL), in French. */
export async function findEssentialQuestion(): Promise<EssentialQuestion | null> {
  const rows = await query<{ question: string; code: string; label: string; prompt: string | null }>(
    `SELECT qt.label AS question, ao.code, ot.label, ot.follow_up_prompt AS prompt
     FROM question_set_item i
     JOIN question q ON q.id = i.question_id
     JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
     JOIN answer_option ao ON ao.question_id = q.id
     JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
     WHERE i.question_set_id = ${QUESTION_SET("ESSENTIAL")} AND q.code = 'OVERALL_SATISFACTION'
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

export type ContactKind = "email" | "phone";

/** The e-mail or phone number given on the last screen, already normalized. */
export interface FeedbackContact {
  kind: ContactKind;
  value: string;
}

/**
 * Last screen (« Envoyer mon avis »): the contact and the statement on honour.
 * Sent again (a network cut, « Précédent »), it replaces the contact; the
 * time of the statement is kept. The statement is also kept on the feedback,
 * which stays published once the contact is deleted after 12 months (0028).
 */
export async function saveFeedbackContact(feedbackId: string, contact: FeedbackContact): Promise<void> {
  await query(
    `WITH saved AS (
       INSERT INTO feedback_contact (feedback_id, kind, value) VALUES ($1, $2, $3)
       ON CONFLICT (feedback_id) DO UPDATE SET kind = excluded.kind, value = excluded.value
       RETURNING feedback_id, attested_at
     )
     UPDATE feedback f SET attested_at = coalesce(f.attested_at, saved.attested_at)
     FROM saved WHERE f.id = saved.feedback_id`,
    [feedbackId, contact.kind, contact.value],
  );
}

/**
 * The page of the questionnaire now shown (0028), while the feedback is not
 * sent: the last one shown is where a feedback never sent stopped.
 */
export async function setLastPage(feedbackId: string, page: "details" | "sector" | "common" | "send"): Promise<void> {
  await query(`UPDATE feedback SET last_page = $2 WHERE id = $1 AND step <> 'completed'`, [feedbackId, page]);
}

/** The contact already given for this feedback (coming back to the last screen). */
export async function findFeedbackContact(feedbackId: string): Promise<FeedbackContact | null> {
  const rows = await query<FeedbackContact>(
    `SELECT kind, value FROM feedback_contact WHERE feedback_id = $1`,
    [feedbackId],
  );
  return rows[0] ?? null;
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
     contacts AS (DELETE FROM feedback_contact WHERE feedback_id IN (SELECT id FROM abandoned)),
     comments AS (DELETE FROM comment WHERE feedback_id IN (SELECT id FROM abandoned)),
     answers AS (DELETE FROM answer WHERE feedback_id IN (SELECT id FROM abandoned))
     DELETE FROM feedback WHERE id IN (SELECT id FROM abandoned)
     RETURNING id`,
    [days],
  );
  return rows.length;
}

/**
 * Nightly cleanup: the e-mail or phone of a person who sent no feedback for
 * `months` months (privacy policy: « 12 mois après votre dernier avis »). The
 * feedbacks stay, with nothing left to tie them to that person. Returns how
 * many contacts were deleted.
 */
export async function deleteExpiredContacts(months: number): Promise<number> {
  const rows = await query(
    `DELETE FROM feedback_contact c
     WHERE NOT EXISTS (
       SELECT 1 FROM feedback_contact recent
       WHERE recent.kind = c.kind AND recent.value = c.value
         AND recent.attested_at >= now() - make_interval(months => $1))
     RETURNING c.feedback_id`,
    [months],
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
  /** A common question (list COMMON), shown on its own page. */
  common: boolean;
}

/**
 * The page's items: the lists given in order (sector, type, service), then
 * COMMON. A question in several of them keeps its first place (and the
 * conditions of that list).
 */
const PAGE_ITEMS = `
  WITH page AS (
    SELECT s.id, s.ord FROM unnest($1::smallint[]) WITH ORDINALITY AS s (id, ord)
    UNION ALL
    SELECT id, 1000 FROM question_set WHERE code = 'COMMON'
  ),
  items AS (
    SELECT DISTINCT ON (i.question_id) i.question_set_id, i.question_id, i.position, p.ord,
           p.ord = 1000 AS common
    FROM page p JOIN question_set_item i ON i.question_set_id = p.id
    ORDER BY i.question_id, p.ord
  )`;

/**
 * Screens 6 and 6b: the questions of the lists attached to the feedback's
 * levels (setIds, from the most general to the most specific), then the
 * common ones, in French and in order, with what this feedback already
 * answered and their conditions. Only questions with options (no free text
 * for now).
 */
export async function findDetailedQuestions(feedbackId: string, setIds: number[]): Promise<DetailedQuestion[]> {
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
      category_position: number | null;
    }>(
      `${PAGE_ITEMS}
       SELECT q.id, q.code, q.type, qt.label, ao.code AS option_code, ot.label AS option_label, it.common,
              (SELECT c.position FROM evaluation_category c WHERE c.id = q.category_id) AS category_position,
              EXISTS (SELECT 1 FROM answer a WHERE a.feedback_id = $2 AND a.option_id = ao.id) AS chosen
       FROM items it
       JOIN question q ON q.id = it.question_id
       JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
       JOIN answer_option ao ON ao.question_id = q.id AND ao.is_active
       JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
       ORDER BY it.ord, it.position, ao.position`,
      [setIds, feedbackId],
    ),
    query<{ code: string; depends_on: string; option_code: string }>(
      `${PAGE_ITEMS}
       SELECT q.code, dq.code AS depends_on, ao.code AS option_code
       FROM items it
       JOIN question_condition qc ON qc.question_set_id = it.question_set_id AND qc.question_id = it.question_id
       JOIN question q ON q.id = qc.question_id
       JOIN question dq ON dq.id = qc.depends_on_question_id
       JOIN answer_option ao ON ao.id = qc.option_id
       ORDER BY dq.code, ao.position`,
      [setIds],
    ),
  ]);
  const questions: DetailedQuestion[] = [];
  const categoryOf = new Map<string, number | null>();
  for (const row of rows) {
    categoryOf.set(row.code, row.category_position);
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
  return byCategory(questions, categoryOf);
}

/** Where a form's items come from: a list and its level. */
export interface FormList {
  code: string;
  level: "common" | "sector" | "type" | "service";
}

/**
 * The lists a form's topics come from (back office), by topic code: every
 * list of its levels holding it, in the order of topicListsOfLevels.
 */
export async function findFormTopicLists(levels: FormLevels): Promise<Record<string, FormList[]>> {
  const rows = await query<{ topic: string; code: string; level: FormList["level"] }>(
    `SELECT t.code AS topic, ts.code, ls.level
     FROM (${topicListsOfLevels(formLevels(1))}) ls
     JOIN topic_set ts ON ts.id = ls.id
     JOIN topic_set_item i ON i.topic_set_id = ls.id
     JOIN topic t ON t.id = i.topic_id
     ORDER BY CASE ls.level WHEN 'common' THEN 1 WHEN 'sector' THEN 2 WHEN 'type' THEN 3 ELSE 4 END`,
    [levels.sector, levels.type, levels.service],
  );
  return groupLists(rows.map((r) => ({ item: r.topic, code: r.code, level: r.level })));
}

/**
 * The lists a form's questions come from (back office), by question code:
 * every list of the page holding it (setIds with their levels, then COMMON).
 */
export async function findFormQuestionLists(
  sets: { id: number; level: FormList["level"] }[],
): Promise<Record<string, FormList[]>> {
  const rows = await query<{ question: string; code: string; ord: number }>(
    `SELECT q.code AS question, qs.code, p.ord::int AS ord
     FROM (SELECT s.id, s.ord FROM unnest($1::smallint[]) WITH ORDINALITY AS s (id, ord)
           UNION ALL SELECT id, 1000 FROM question_set WHERE code = 'COMMON') p
     JOIN question_set qs ON qs.id = p.id
     JOIN question_set_item i ON i.question_set_id = p.id
     JOIN question q ON q.id = i.question_id
     ORDER BY p.ord`,
    [sets.map((s) => s.id)],
  );
  return groupLists(
    rows.map((r) => ({ item: r.question, code: r.code, level: r.ord === 1000 ? "common" : sets[r.ord - 1]!.level })),
  );
}

function groupLists(rows: { item: string; code: string; level: FormList["level"] }[]): Record<string, FormList[]> {
  const lists: Record<string, FormList[]> = {};
  for (const row of rows) (lists[row.item] ??= []).push({ code: row.code, level: row.level });
  return lists;
}

/** Screens 6 and 6b of a form (back office): its questions, nothing answered. */
export async function findFormQuestions(setIds: number[]): Promise<DetailedQuestion[]> {
  return findDetailedQuestions(NO_FEEDBACK, setIds);
}

/**
 * The page in the order of the evaluation categories, like the topics
 * (« Résultat obtenu » first, 0021). A
 * question that another opens stays right after it, so each question goes
 * with the first one of its chain. Otherwise the lists' order is kept. The
 * common questions stay last, on their own page. Also the order of a list in
 * the back office's Questionnaire tables.
 */
export function byCategory<Q extends { code: string; conditions: { dependsOn: string }[]; common?: boolean }>(
  questions: Q[],
  categoryOf: Map<string, number | null>,
): Q[] {
  const index = new Map(questions.map((q, i) => [q.code, i]));
  // The question asked before on this page that opens this one, if any.
  const rootOf = (q: Q): string => {
    const parent = q.conditions.find((c) => (index.get(c.dependsOn) ?? Infinity) < index.get(q.code)!);
    return parent ? rootOf(questions[index.get(parent.dependsOn)!]) : q.code;
  };
  const roots = new Map(questions.map((q) => [q.code, rootOf(q)]));
  // A chain whose first question has no category: first while nothing rated
  // came before it (« Vous êtes », « Pourquoi êtes-vous venu(e) ? »), else
  // with the first category of the questions it opens (« Avez-vous payé… ? »
  // with the receipt), else with the chain before it (« Recommanderiez-
  // vous… ? » stays at the end).
  const keys = new Map<string, number>();
  let previous = -1;
  for (const root of new Set(roots.values())) {
    const opened = questions
      .filter((q) => q.code !== root && roots.get(q.code) === root)
      .flatMap((q) => categoryOf.get(q.code) ?? []);
    previous =
      categoryOf.get(root) ?? (previous === -1 ? -1 : opened.length ? Math.min(...opened) : previous);
    keys.set(root, previous);
  }
  const keyOf = (q: Q) => keys.get(roots.get(q.code)!)!;
  return [...questions].sort(
    (a, b) =>
      Number(a.common ?? false) - Number(b.common ?? false) ||
      keyOf(a) - keyOf(b) ||
      index.get(roots.get(a.code)!)! - index.get(roots.get(b.code)!)! ||
      index.get(a.code)! - index.get(b.code)!,
  );
}

/**
 * Codes of the questions screen 2b asks for this feedback: those that open one
 * of its topics. Screen 6 does not ask them again.
 */
export async function findTopicGateCodes(feedbackId: string): Promise<string[]> {
  const rows = await query<{ code: string }>(
    `SELECT DISTINCT q.code
     FROM (${topicsForFeedback("$1")}) t
     JOIN topic_condition tc ON tc.topic_id = t.id
     JOIN question q ON q.id = tc.depends_on_question_id
     ORDER BY q.code`,
    [feedbackId],
  );
  return rows.map((r) => r.code);
}

/** Removes this feedback's answer to one question (screen 2b: a yes/no touched again, so cleared). */
export async function deleteAnswerByCode(feedbackId: string, questionCode: string): Promise<void> {
  await query(
    "DELETE FROM answer WHERE feedback_id = $1 AND question_id = (SELECT id FROM question WHERE code = $2)",
    [feedbackId, questionCode],
  );
}

/**
 * Screen 1 sent again (« Précédent » from screen 2, then « Commencer »): the
 * essential question starts empty again, unless the feedback is complete.
 */
export async function clearEssentialAnswer(feedbackId: string): Promise<void> {
  await query(
    `DELETE FROM answer a
     USING feedback f, question q
     WHERE a.feedback_id = $1 AND f.id = a.feedback_id AND f.step <> 'completed'
       AND q.id = a.question_id AND q.code = 'OVERALL_SATISFACTION'`,
    [feedbackId],
  );
}

/** Removes this feedback's answers to these questions (answers that no longer apply). */
export async function deleteAnswers(feedbackId: string, questionIds: number[]): Promise<void> {
  if (questionIds.length === 0) return;
  await query("DELETE FROM answer WHERE feedback_id = $1 AND question_id = ANY($2::int[])", [feedbackId, questionIds]);
}
