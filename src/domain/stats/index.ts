import { deleteAbandonedFeedbacks, deleteExpiredContacts } from "../../db/feedbacks";
import * as db from "../../db/stats";

/**
 * A feedback started at screen 1 but never answered at the essential question
 * is deleted after this many days. Kept until then to measure abandons.
 */
export const ABANDONED_FEEDBACK_DAYS = 7;

/** The e-mail or phone is deleted this many months after the person's last feedback. */
export const CONTACT_RETENTION_MONTHS = 12;

/**
 * Nightly job: deletes the abandoned feedbacks and the expired contacts, then
 * recomputes monthly_stats, the source of the published results.
 */
export async function refreshPublishedStats(): Promise<{
  refreshedAt: string;
  abandonedDeleted: number;
  contactsDeleted: number;
}> {
  const abandonedDeleted = await deleteAbandonedFeedbacks(ABANDONED_FEEDBACK_DAYS);
  const contactsDeleted = await deleteExpiredContacts(CONTACT_RETENTION_MONTHS);
  await db.refreshMonthlyStats();
  return { refreshedAt: new Date().toISOString(), abandonedDeleted, contactsDeleted };
}

export { getPublishedResults, type PublishedResults } from "./results";
