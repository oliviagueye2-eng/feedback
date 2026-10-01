import { deleteAbandonedFeedbacks } from "../../db/feedbacks";
import * as db from "../../db/stats";

/**
 * A feedback started at screen 1 but never answered at the essential question
 * is deleted after this many days. Kept until then to measure abandons.
 */
export const ABANDONED_FEEDBACK_DAYS = 7;

/**
 * Nightly job: deletes the abandoned feedbacks, then recomputes monthly_stats,
 * the source of the published results.
 */
export async function refreshPublishedStats(): Promise<{ refreshedAt: string; abandonedDeleted: number }> {
  const abandonedDeleted = await deleteAbandonedFeedbacks(ABANDONED_FEEDBACK_DAYS);
  await db.refreshMonthlyStats();
  return { refreshedAt: new Date().toISOString(), abandonedDeleted };
}
