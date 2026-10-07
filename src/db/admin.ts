/**
 * Data access for the back-office (0028): sign-in attempts, comments to read,
 * establishments added by users, and the dashboard's figures.
 */
import { invalidInput, notFound } from "../domain/errors";
import { OTHER_TYPE } from "../domain/types";
import { query } from "./client";

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

export async function listComments(status: CommentStatus, newestFirst: boolean): Promise<AdminComment[]> {
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
     WHERE c.status = $1
     ORDER BY c.created_at ${newestFirst ? "DESC" : "ASC"}, c.feedback_id`,
    [status],
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
