/**
 * Shared business types. Values match the enums described in
 * docs/architecture-base-de-donnees.md.
 */

export type EstablishmentStatus =
  | "active"
  | "pending_review"
  | "rejected"
  | "merged"
  | "closed";

export type Ownership = "public" | "private" | "community";

export type Channel = "qr" | "search" | "link";

export type FeedbackStep = "essential" | "detailed" | "completed";

export const VISIT_PERIODS = [
  "today",
  "under_week",
  "under_month",
  "over_month",
] as const;
export type VisitPeriod = (typeof VISIT_PERIODS)[number];

export interface EstablishmentSummary {
  id: string;
  name: string;
  municipalityName: string | null;
  typeCode: string | null;
}

export interface EstablishmentSearchResult {
  /** "service" when the query looks like a service ("état civil"): the UI then shows the "Précisez l'établissement" hint. */
  matchType: "establishment" | "service";
  results: EstablishmentSummary[];
}
