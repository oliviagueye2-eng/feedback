import * as db from "../../db/stats";

/** Nightly job: recompute monthly_stats, the source of the published results. */
export async function refreshPublishedStats(): Promise<{ refreshedAt: string }> {
  await db.refreshMonthlyStats();
  return { refreshedAt: new Date().toISOString() };
}
