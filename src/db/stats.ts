import { getPool } from "./client";

/**
 * Recomputes the published results. CONCURRENTLY keeps the view readable
 * during the refresh (it relies on the monthly_stats_key unique index).
 */
export async function refreshMonthlyStats(): Promise<void> {
  await getPool().query("REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats");
}
