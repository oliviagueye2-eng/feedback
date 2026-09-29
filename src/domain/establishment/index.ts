import * as db from "../../db/establishments";
import { normalizeForSearch } from "../../lib/text";
import { asObject, optionalString, requireString } from "../../lib/validation";
import { notFound } from "../errors";
import type { EstablishmentSearchResult } from "../types";

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_LIMIT = 8;
/** Screen 0b: at most this many "Vouliez-vous dire" suggestions. */
export const SUGGESTION_LIMIT = 3;
/** Below this number of feedbacks in a month, nothing is published (anonymity, representativeness). */
export const MIN_FEEDBACK_TO_PUBLISH = 10;

/** Screen 0a: autocomplete. Only active establishments are returned. */
export async function searchEstablishments(
  query: string,
): Promise<EstablishmentSearchResult> {
  const normalized = normalizeForSearch(query);
  if (normalized.length < SEARCH_MIN_LENGTH) {
    return { matchType: "establishment", results: [], suggestions: [] };
  }
  const found = await db.searchActiveEstablishments(normalized, SEARCH_LIMIT);
  if (found.results.length > 0) return found;
  return { ...found, suggestions: await db.findSimilarEstablishments(normalized, SUGGESTION_LIMIT) };
}

/** Screen 0c: the optional sector list. */
export async function listSectors() {
  return db.listSectors();
}

export async function getEstablishment(id: string) {
  const establishment = await db.findEstablishmentById(id);
  if (!establishment) throw notFound("Establishment not found");
  return establishment;
}

/** QR code scanned: the establishment (and possibly the service) is already known. */
export async function getEstablishmentByQrCode(code: string) {
  const found = await db.findEstablishmentByQrCode(code);
  if (!found) throw notFound("QR code not found or inactive");
  return found;
}

/**
 * Screen 0c: establishment typed by the user when it is not in the registry.
 * Only the name is required; it is stored as pending_review until an agent checks it.
 */
export async function createUserEstablishment(body: unknown): Promise<{ id: string }> {
  const input = asObject(body);
  const id = await db.insertUserEstablishment({
    rawInput: requireString(input, "name", { min: 2, max: 200 }),
    sectorCode: optionalString(input, "sector", { max: 64 }),
    municipalityInput: optionalString(input, "municipality", { max: 120 }),
  });
  return { id };
}

export async function getEstablishmentStats(id: string) {
  return db.findPublishedStats(id, MIN_FEEDBACK_TO_PUBLISH);
}
