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
  /** French label of the sector, shown under the name in search results. */
  sectorLabel: string | null;
  /** "general": an organisation rated as a whole (Senelec in general), not one of its places. */
  scope: EstablishmentScope;
}

export type EstablishmentScope = "site" | "general";

export interface EstablishmentSearchResult {
  /** "service" when the query looks like a service ("état civil"): the UI then shows the "Précisez l'établissement" hint. */
  matchType: "establishment" | "service";
  results: EstablishmentSummary[];
  /** Screen 0b: close matches ("Vouliez-vous dire"), only when results is empty. */
  suggestions: EstablishmentSummary[];
}

export interface Sector {
  code: string;
  label: string;
}
