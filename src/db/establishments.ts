/**
 * Data access for the registry (establishment, service, municipality, qr_code).
 * Queries are to be written once the schema migration exists.
 */
import { notImplemented } from "../domain/errors";
import type { EstablishmentSearchResult, EstablishmentSummary } from "../domain/types";

export interface EstablishmentDetail extends EstablishmentSummary {
  services: { id: number; code: string }[];
}

export interface NewUserEstablishment {
  rawInput: string;
  typeId: number | null;
  municipalityInput: string | null;
}

export interface EstablishmentStats {
  month: string;
  feedbackCount: number;
  avgSatisfaction: number;
}

/**
 * Searches active establishments on establishment.search_text, and
 * service.search_text translated into the establishments offering it.
 * `normalizedQuery` is already lowercased and without accents.
 */
export async function searchActiveEstablishments(
  normalizedQuery: string,
  limit: number,
): Promise<EstablishmentSearchResult> {
  void normalizedQuery;
  void limit;
  throw notImplemented("db.searchActiveEstablishments");
}

export async function findEstablishmentById(
  id: string,
): Promise<EstablishmentDetail | null> {
  void id;
  throw notImplemented("db.findEstablishmentById");
}

export async function findEstablishmentByQrCode(
  code: string,
): Promise<{ establishment: EstablishmentDetail; serviceId: number | null; qrCodeId: string } | null> {
  void code;
  throw notImplemented("db.findEstablishmentByQrCode");
}

/** Inserts with status = pending_review and source = user. Returns the new id. */
export async function insertUserEstablishment(
  input: NewUserEstablishment,
): Promise<string> {
  void input;
  throw notImplemented("db.insertUserEstablishment");
}

/** Reads monthly_stats rows for one establishment, most recent first. */
export async function findPublishedStats(
  establishmentId: string,
  minFeedbackCount: number,
): Promise<EstablishmentStats[]> {
  void establishmentId;
  void minFeedbackCount;
  throw notImplemented("db.findPublishedStats");
}
