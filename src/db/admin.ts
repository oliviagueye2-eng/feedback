/**
 * Data access for the back-office (0028): sign-in attempts, comments to read,
 * establishments added by users, and the dashboard's figures.
 */
import { invalidInput, notFound } from "../domain/errors";
import { OTHER_TYPE } from "../domain/types";
import { query } from "./client";
import { byCategory } from "./feedbacks";

// ---------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------

/** Failed sign-ins from this address in the last `minutes` minutes. */
export async function countRecentLoginFailures(ip: string, minutes: number): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM admin_login_attempt
     WHERE ip = $1 AND attempted_at > now() - make_interval(mins => $2)`,
    [ip, minutes],
  );
  return rows[0]?.n ?? 0;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  await query(`INSERT INTO admin_login_attempt (ip) VALUES ($1)`, [ip]);
}

/** A successful sign-in starts the count again for this address. */
export async function clearLoginFailures(ip: string): Promise<void> {
  await query(`DELETE FROM admin_login_attempt WHERE ip = $1`, [ip]);
}

/** Nightly cleanup: attempts older than `hours` hours. */
export async function deleteOldLoginAttempts(hours: number): Promise<number> {
  const rows = await query(
    `DELETE FROM admin_login_attempt WHERE attempted_at < now() - make_interval(hours => $1) RETURNING ip`,
    [hours],
  );
  return rows.length;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type CommentStatus = "pending" | "reviewed";

export interface AdminComment {
  feedbackId: string;
  text: string;
  establishmentName: string;
  serviceLabel: string | null;
  visitMonth: string | null;
  satisfactionLabel: string | null;
  /** The feedback was sent (« Envoyer mon avis »). */
  sent: boolean;
  createdAt: string;
}

/** `establishmentId`: only the comments on that establishment (or on one merged into it). */
export async function listComments(
  status: CommentStatus,
  newestFirst: boolean,
  establishmentId: string | null = null,
): Promise<AdminComment[]> {
  return query<AdminComment>(
    `SELECT c.feedback_id AS "feedbackId", c.text, e.name AS "establishmentName",
            st.label AS "serviceLabel", to_char(f.visit_month, 'YYYY-MM') AS "visitMonth",
            aot.label AS "satisfactionLabel", f.step = 'completed' AS sent,
            c.created_at AS "createdAt"
     FROM comment c
     JOIN feedback f ON f.id = c.feedback_id
     JOIN establishment e ON e.id = f.establishment_id
     LEFT JOIN service_translation st ON st.service_id = f.service_id AND st.language = 'fr'
     LEFT JOIN answer_option_translation aot ON aot.answer_option_id = c.prompt_option_id AND aot.language = 'fr'
     WHERE c.status = $1 AND ($2::uuid IS NULL OR coalesce(e.merged_into_id, e.id) = $2)
     ORDER BY c.created_at ${newestFirst ? "DESC" : "ASC"}, c.feedback_id`,
    [status, establishmentId],
  );
}

export interface EstablishmentComments {
  establishmentId: string;
  name: string;
  municipality: string | null;
  total: number;
  pending: number;
}

/** Establishments with comments written this month, the most commented first. */
export async function countCommentsByEstablishmentThisMonth(): Promise<EstablishmentComments[]> {
  return query<EstablishmentComments>(
    `SELECT t.id AS "establishmentId", t.name,
            coalesce(m.name, t.municipality_input) AS municipality,
            count(*)::int AS total,
            count(*) FILTER (WHERE c.status = 'pending')::int AS pending
     FROM comment c
     JOIN feedback f ON f.id = c.feedback_id
     JOIN establishment e ON e.id = f.establishment_id
     JOIN establishment t ON t.id = coalesce(e.merged_into_id, e.id)
     LEFT JOIN municipality m ON m.id = t.municipality_id
     WHERE c.created_at >= date_trunc('month', now())
     GROUP BY t.id, t.name, m.name, t.municipality_input
     ORDER BY total DESC, t.name`,
  );
}

export async function countPendingComments(): Promise<number> {
  const rows = await query<{ n: number }>(`SELECT count(*)::int AS n FROM comment WHERE status = 'pending'`);
  return rows[0]?.n ?? 0;
}

/** Read: leaves the list of comments to read. */
export async function markCommentReviewed(feedbackId: string): Promise<void> {
  const rows = await query(
    `UPDATE comment SET status = 'reviewed' WHERE feedback_id = $1 RETURNING feedback_id`,
    [feedbackId],
  );
  if (rows.length === 0) throw notFound("Comment not found");
}

/** Personal details removed: the new text replaces the old one, which is kept nowhere. */
export async function replaceCommentText(feedbackId: string, text: string): Promise<void> {
  const rows = await query(
    `UPDATE comment SET text = $2, status = 'reviewed' WHERE feedback_id = $1 RETURNING feedback_id`,
    [feedbackId, text],
  );
  if (rows.length === 0) throw notFound("Comment not found");
}

// ---------------------------------------------------------------------------
// Establishments added by users
// ---------------------------------------------------------------------------

export interface PendingEstablishment {
  id: string;
  name: string;
  sectorCode: string | null;
  sectorLabel: string | null;
  typeCode: string | null;
  typeLabel: string | null;
  municipality: string | null;
  feedbackCount: number;
  createdAt: string;
}

export async function listPendingEstablishments(): Promise<PendingEstablishment[]> {
  return query<PendingEstablishment>(
    `SELECT e.id, e.name,
            s.code AS "sectorCode", stt.label AS "sectorLabel",
            et.code AS "typeCode", ett.label AS "typeLabel",
            coalesce(m.name, e.municipality_input) AS municipality,
            (SELECT count(*)::int FROM feedback f WHERE f.establishment_id = e.id) AS "feedbackCount",
            e.created_at AS "createdAt"
     FROM establishment e
     LEFT JOIN establishment_type et ON et.id = e.type_id
     LEFT JOIN establishment_type_translation ett ON ett.establishment_type_id = et.id AND ett.language = 'fr'
     LEFT JOIN sector s ON s.id = coalesce(et.sector_id, e.sector_id)
     LEFT JOIN sector_translation stt ON stt.sector_id = s.id AND stt.language = 'fr'
     LEFT JOIN municipality m ON m.id = e.municipality_id
     WHERE e.status = 'pending_review'
     ORDER BY e.created_at, e.id`,
  );
}

export async function countPendingEstablishments(): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM establishment WHERE status = 'pending_review'`,
  );
  return rows[0]?.n ?? 0;
}

/**
 * Corrects an establishment still to check: name, municipality (as typed),
 * sector and type (a type of that sector, or OTHER_TYPE: none).
 */
export async function updatePendingEstablishment(
  id: string,
  input: { name: string; municipality: string | null; sectorCode: string; typeCode: string },
): Promise<void> {
  const rows = await query(
    `UPDATE establishment e
     SET name = $2, municipality_input = $3, sector_id = s.id, type_id = et.id
     FROM sector s
     LEFT JOIN establishment_type et ON et.code = $5 AND et.sector_id = s.id
     WHERE e.id = $1 AND e.status = 'pending_review' AND s.code = $4
       AND (et.id IS NOT NULL OR $5 = $6
            OR NOT EXISTS (SELECT 1 FROM establishment_type t WHERE t.sector_id = s.id))
     RETURNING e.id`,
    [id, input.name, input.municipality, input.sectorCode, input.typeCode, OTHER_TYPE],
  );
  if (rows.length === 0) throw invalidInput("Unknown establishment, sector, or type not of the sector");
}

/** Validated (shown in the search) or refused (its feedbacks no longer count). */
export async function setPendingEstablishmentStatus(id: string, status: "active" | "rejected"): Promise<void> {
  const rows = await query(
    `UPDATE establishment SET status = $2 WHERE id = $1 AND status = 'pending_review' RETURNING id`,
    [id, status],
  );
  if (rows.length === 0) throw notFound("Establishment not found or already handled");
}

/**
 * The same place as an establishment already listed: its feedbacks move to
 * that one, and it stays as « merged » (its id may still be in a shared link).
 */
export async function mergePendingEstablishment(id: string, targetId: string): Promise<void> {
  const rows = await query(
    `WITH target AS (
       SELECT id FROM establishment WHERE id = $2 AND status = 'active' AND id <> $1
     ),
     moved AS (
       UPDATE feedback SET establishment_id = (SELECT id FROM target)
       WHERE establishment_id = $1 AND EXISTS (SELECT 1 FROM target)
       RETURNING id
     )
     UPDATE establishment
     SET status = 'merged', merged_into_id = (SELECT id FROM target)
     WHERE id = $1 AND status = 'pending_review' AND EXISTS (SELECT 1 FROM target)
     RETURNING id`,
    [id, targetId],
  );
  if (rows.length === 0) throw notFound("Establishment or target not found");
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface MonthFigures {
  /** Sent this month (« Envoyer mon avis »). */
  complete: number;
  /** Started this month, at least the essential question answered, not sent `hours` hours later. */
  notSent: number;
  /** Satisfied (very or rather) among each group; null when the group is empty. */
  satisfiedComplete: number | null;
  satisfiedNotSent: number | null;
}

const SATISFACTION = `
  SELECT a.feedback_id, ao.code IN ('VERY_SATISFIED', 'SATISFIED') AS satisfied
  FROM answer a
  JOIN question q ON q.id = a.question_id AND q.code = 'OVERALL_SATISFACTION'
  JOIN answer_option ao ON ao.id = a.option_id`;

/** Not sent: started before now() - hours, never completed, essential question answered. */
const NOT_SENT = `f.step <> 'completed' AND f.started_at < now() - make_interval(hours => $1)`;

export async function getMonthFigures(hours: number): Promise<MonthFigures> {
  const rows = await query<MonthFigures>(
    `WITH s AS (${SATISFACTION}),
     month AS (SELECT date_trunc('month', now()) AS start)
     SELECT
       count(*) FILTER (WHERE f.step = 'completed' AND f.completed_at >= month.start)::int AS complete,
       count(*) FILTER (WHERE ${NOT_SENT} AND f.started_at >= month.start)::int AS "notSent",
       round(100.0 * avg(s.satisfied::int) FILTER (WHERE f.step = 'completed' AND f.completed_at >= month.start))::int
         AS "satisfiedComplete",
       round(100.0 * avg(s.satisfied::int) FILTER (WHERE ${NOT_SENT} AND f.started_at >= month.start))::int
         AS "satisfiedNotSent"
     FROM feedback f
     JOIN s ON s.feedback_id = f.id
     CROSS JOIN month`,
    [hours],
  );
  return rows[0]!;
}

export type StopPage = "details" | "sector" | "common" | "send";

export interface StopPageCount {
  page: StopPage;
  satisfied: number;
  notSatisfied: number;
}

/** This month's feedbacks not sent, by the page left without submitting. */
export async function countStopPages(hours: number): Promise<StopPageCount[]> {
  return query<StopPageCount>(
    `WITH s AS (${SATISFACTION})
     SELECT f.last_page AS page,
            count(*) FILTER (WHERE s.satisfied)::int AS satisfied,
            count(*) FILTER (WHERE NOT s.satisfied)::int AS "notSatisfied"
     FROM feedback f
     JOIN s ON s.feedback_id = f.id
     WHERE ${NOT_SENT} AND f.started_at >= date_trunc('month', now()) AND f.last_page IS NOT NULL
     GROUP BY f.last_page`,
    [hours],
  );
}

/** Feedbacks sent per week, the last `weeks` weeks (Monday first), this one included. */
export async function countCompleteByWeek(weeks: number): Promise<{ week: string; count: number }[]> {
  return query<{ week: string; count: number }>(
    `WITH w AS (
       SELECT generate_series(date_trunc('week', now()) - make_interval(weeks => $1 - 1),
                              date_trunc('week', now()), interval '1 week') AS week
     )
     SELECT to_char(w.week, 'YYYY-MM-DD') AS week,
            (SELECT count(*)::int FROM feedback f
             WHERE f.step = 'completed' AND f.completed_at >= w.week
               AND f.completed_at < w.week + interval '1 week') AS count
     FROM w ORDER BY w.week`,
    [weeks],
  );
}

// ---------------------------------------------------------------------------
// Questionnaire (page asked by Olivia, 2026-10-08): what each sector, type
// and service brings to screen 2b.
// ---------------------------------------------------------------------------

/** The answers to a question that show a topic at screen 2b (topic_condition, 0011). */
export interface TopicShownIf {
  dependsOn: string;
  options: string[];
}

export interface ListedTopic {
  code: string;
  isActive: boolean;
  categoryCode: string | null;
  shownIf: TopicShownIf | null;
}

/** The condition of topic `t`, or null: a topic depends on one question at most. */
const TOPIC_SHOWN_IF = `
  (SELECT json_build_object('dependsOn', dq.code, 'options', array_agg(o.code ORDER BY o.position))
   FROM topic_condition tc
   JOIN question dq ON dq.id = tc.depends_on_question_id
   JOIN answer_option o ON o.id = tc.option_id
   WHERE tc.topic_id = t.id
   GROUP BY dq.code)`;

/**
 * The topics of topic_set `$col` in the order of their category, then of
 * topic.position, as on screen 2b (asked by Olivia); inactive ones included.
 */
const TOPICS_OF = (col: string) => `
  coalesce((SELECT json_agg(json_build_object('code', t.code, 'isActive', t.is_active, 'categoryCode', c.code,
                                              'shownIf', ${TOPIC_SHOWN_IF})
                             ORDER BY c.position NULLS LAST, t.position, t.code)
            FROM topic_set_item i JOIN topic t ON t.id = i.topic_id
            LEFT JOIN evaluation_category c ON c.id = t.category_id
            WHERE i.topic_set_id = ${col}), '[]'::json)`;

/** A question of a list, in the list's order. */
export interface ListedQuestion {
  code: string;
  position: number;
  categoryCode: string | null;
}

/**
 * The questions of question_set `$col` by question_set_item.position, with
 * what `inScreenOrder` needs.
 */
const QUESTIONS_OF = (col: string) => `
  coalesce((SELECT json_agg(json_build_object('code', q.code, 'position', i.position, 'categoryCode', c.code,
                                              'categoryPosition', c.position,
                                              'dependsOn', (SELECT coalesce(json_agg(DISTINCT dq.code), '[]'::json)
                                                            FROM question_condition qc
                                                            JOIN question dq ON dq.id = qc.depends_on_question_id
                                                            WHERE qc.question_set_id = i.question_set_id
                                                              AND qc.question_id = i.question_id))
                             ORDER BY i.position)
            FROM question_set_item i JOIN question q ON q.id = i.question_id
            LEFT JOIN evaluation_category c ON c.id = q.category_id
            WHERE i.question_set_id = ${col}), '[]'::json)`;

type RawQuestion = ListedQuestion & { categoryPosition: number | null; dependsOn: string[] };

/**
 * A level's questions in the order screen 6 asks them (asked by Olivia,
 * 2026-10-08): by category, a question right after the one that opens it.
 */
function inScreenOrder<L extends { questions: ListedQuestion[] }>(levels: L[]): L[] {
  return levels.map((level) => {
    const raw = level.questions as RawQuestion[];
    const ordered = byCategory(
      raw.map((q) => ({ ...q, conditions: q.dependsOn.map((dependsOn) => ({ dependsOn })) })),
      new Map(raw.map((q) => [q.code, q.categoryPosition])),
    );
    return { ...level, questions: ordered.map(({ code, position, categoryCode }) => ({ code, position, categoryCode })) };
  });
}

export interface SectorTopics {
  code: string;
  label: string | null;
  listCode: string | null;
  topics: ListedTopic[];
  /** Screen 6 (asked by Olivia, 2026-10-08): the level's question list. */
  questionListCode: string | null;
  questions: ListedQuestion[];
}

export async function listSectorTopics(): Promise<SectorTopics[]> {
  return inScreenOrder(await query<SectorTopics>(
    `SELECT s.code, st.label, ts.code AS "listCode", ${TOPICS_OF("s.topic_set_id")} AS topics,
            qs.code AS "questionListCode", ${QUESTIONS_OF("s.question_set_id")} AS questions
     FROM sector s
     LEFT JOIN sector_translation st ON st.sector_id = s.id AND st.language = 'fr'
     LEFT JOIN topic_set ts ON ts.id = s.topic_set_id
     LEFT JOIN question_set qs ON qs.id = s.question_set_id
     ORDER BY st.label, s.code`,
  ));
}

export interface TypeTopics extends SectorTopics {
  sectorCode: string;
  /** No direct link: the services of the active establishments of this type. */
  services: string[];
}

export async function listTypeTopics(): Promise<TypeTopics[]> {
  return inScreenOrder(await query<TypeTopics>(
    `SELECT et.code, ett.label, s.code AS "sectorCode", ts.code AS "listCode",
            ${TOPICS_OF("et.topic_set_id")} AS topics,
            qs.code AS "questionListCode", ${QUESTIONS_OF("et.question_set_id")} AS questions,
            coalesce((SELECT array_agg(DISTINCT sv.code ORDER BY sv.code)
                      FROM establishment e
                      JOIN establishment_service es ON es.establishment_id = e.id
                      JOIN service sv ON sv.id = es.service_id
                      WHERE e.type_id = et.id AND e.status = 'active'), '{}') AS services
     FROM establishment_type et
     JOIN sector s ON s.id = et.sector_id
     LEFT JOIN establishment_type_translation ett ON ett.establishment_type_id = et.id AND ett.language = 'fr'
     LEFT JOIN topic_set ts ON ts.id = et.topic_set_id
     LEFT JOIN question_set qs ON qs.id = et.question_set_id
     ORDER BY s.code, et.code`,
  ));
}

export interface ServiceTopics {
  code: string;
  label: string | null;
  replacesSharedLists: boolean;
  listCode: string | null;
  topics: ListedTopic[];
  questionListCode: string | null;
  questions: ListedQuestion[];
  /** Active establishments offering it (establishment_service), by name. */
  establishments: string[];
  /** Their sectors and types: used by the page's filters. */
  sectorCodes: string[];
  typeCodes: string[];
}

export async function listServiceTopics(): Promise<ServiceTopics[]> {
  return inScreenOrder(await query<ServiceTopics>(
    `WITH offered AS (
       SELECT es.service_id, e.name, s.code AS sector_code, et.code AS type_code
       FROM establishment_service es
       JOIN establishment e ON e.id = es.establishment_id AND e.status = 'active'
       LEFT JOIN establishment_type et ON et.id = e.type_id
       LEFT JOIN sector s ON s.id = coalesce(et.sector_id, e.sector_id)
     )
     SELECT sv.code, st.label, sv.replaces_shared_lists AS "replacesSharedLists", ts.code AS "listCode",
            ${TOPICS_OF("sv.topic_set_id")} AS topics,
            qs.code AS "questionListCode", ${QUESTIONS_OF("sv.question_set_id")} AS questions,
            coalesce((SELECT array_agg(o.name ORDER BY o.name) FROM offered o WHERE o.service_id = sv.id), '{}')
              AS establishments,
            coalesce((SELECT array_agg(DISTINCT o.sector_code) FROM offered o
                      WHERE o.service_id = sv.id AND o.sector_code IS NOT NULL), '{}') AS "sectorCodes",
            coalesce((SELECT array_agg(DISTINCT o.type_code) FROM offered o
                      WHERE o.service_id = sv.id AND o.type_code IS NOT NULL), '{}') AS "typeCodes"
     FROM service sv
     LEFT JOIN service_translation st ON st.service_id = sv.id AND st.language = 'fr'
     LEFT JOIN topic_set ts ON ts.id = sv.topic_set_id
     LEFT JOIN question_set qs ON qs.id = sv.question_set_id
     ORDER BY sv.code`,
  ));
}

export interface BankOption {
  code: string;
  label: string | null;
  isActive: boolean;
}

/** « In this list, shown only after one of these answers » (question_condition). */
export interface BankCondition {
  listCode: string;
  dependsOn: string;
  options: string[];
}

export interface BankQuestion {
  code: string;
  label: string | null;
  type: string;
  categoryCode: string | null;
  /** The question lists holding it; none for a question asked elsewhere or withdrawn. */
  lists: string[];
  options: BankOption[];
  conditions: BankCondition[];
  /** The topics of screen 2b it shows (topic_condition). */
  opensTopics: string[];
}

/**
 * Every question, written once (the bank), with its answers and conditions;
 * by category, then by code (asked by Olivia, 2026-10-08).
 */
export async function listQuestionBank(): Promise<BankQuestion[]> {
  return query<BankQuestion>(
    `SELECT q.code, qt.label, q.type, c.code AS "categoryCode",
            coalesce((SELECT array_agg(qs.code ORDER BY qs.code)
                      FROM question_set_item i JOIN question_set qs ON qs.id = i.question_set_id
                      WHERE i.question_id = q.id), '{}') AS lists,
            coalesce((SELECT json_agg(json_build_object('code', o.code, 'label', ot.label, 'isActive', o.is_active)
                                      ORDER BY o.position)
                      FROM answer_option o
                      LEFT JOIN answer_option_translation ot ON ot.answer_option_id = o.id AND ot.language = 'fr'
                      WHERE o.question_id = q.id), '[]'::json) AS options,
            coalesce((SELECT json_agg(json_build_object('listCode', x.list_code, 'dependsOn', x.depends_on,
                                                        'options', x.options) ORDER BY x.list_code, x.depends_on)
                      FROM (SELECT qs.code AS list_code, dq.code AS depends_on,
                                   array_agg(o.code ORDER BY o.position) AS options
                            FROM question_condition qc
                            JOIN question_set qs ON qs.id = qc.question_set_id
                            JOIN question dq ON dq.id = qc.depends_on_question_id
                            JOIN answer_option o ON o.id = qc.option_id
                            WHERE qc.question_id = q.id
                            GROUP BY qs.code, dq.code) x), '[]'::json) AS conditions,
            coalesce((SELECT array_agg(DISTINCT t.code) FROM topic_condition tc JOIN topic t ON t.id = tc.topic_id
                      WHERE tc.depends_on_question_id = q.id), '{}') AS "opensTopics"
     FROM question q
     LEFT JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
     LEFT JOIN evaluation_category c ON c.id = q.category_id
     ORDER BY c.position NULLS LAST, q.code`,
  );
}

export interface CategoryContent {
  code: string;
  label: string | null;
  position: number;
  topics: ListedTopic[];
  questions: string[];
}

/** The categories, linking topics of screen 2b and questions of screen 6 on the same subject. */
export async function listCategories(): Promise<CategoryContent[]> {
  return query<CategoryContent>(
    `SELECT c.code, ct.label, c.position,
            coalesce((SELECT json_agg(json_build_object('code', t.code, 'isActive', t.is_active, 'categoryCode', c.code,
                                                        'shownIf', ${TOPIC_SHOWN_IF})
                                      ORDER BY t.position, t.code)
                      FROM topic t WHERE t.category_id = c.id), '[]'::json) AS topics,
            coalesce((SELECT array_agg(q.code ORDER BY q.code) FROM question q WHERE q.category_id = c.id), '{}')
              AS questions
     FROM evaluation_category c
     LEFT JOIN evaluation_category_translation ct ON ct.evaluation_category_id = c.id AND ct.language = 'fr'
     ORDER BY c.position`,
  );
}
