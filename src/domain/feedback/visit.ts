import type { VisitPeriod } from "../types";

/**
 * Estimated month of the visit, computed once when the feedback is saved
 * (feedback.visit_month). It never changes afterwards: a feedback given on
 * March 10 with "under_week" always counts for March.
 *
 * Returns null for "over_month": the visit date is too uncertain, and those
 * feedbacks are kept but excluded from published results.
 *
 * Returns the first day of the month, in UTC, as "YYYY-MM-01".
 */
export function computeVisitMonth(
  period: VisitPeriod,
  startedAt: Date,
): string | null {
  if (period === "over_month") return null;
  const y = startedAt.getUTCFullYear();
  const m = String(startedAt.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Arrival through a QR code means the user is on site: the visit is today. */
export function defaultVisitPeriod(channel: "qr" | "search" | "link"): VisitPeriod | null {
  return channel === "qr" ? "today" : null;
}
