import * as db from "../../db/establishments";
import { normalizeQrCode } from "../../lib/qr";
import { toSearchTerms } from "../../lib/text";
import { asObject, optionalString, requireString } from "../../lib/validation";
import { notFound } from "../errors";
import type { EstablishmentSearchResult } from "../types";

export { guessFromName } from "./guessFromName";

/** Below 3 letters, nothing is proposed. */
export const SEARCH_MIN_LENGTH = 3;
/** From 5 letters, typos are tolerated ("dantek" finds Dantec); before, only starts of words. */
export const FUZZY_MIN_LENGTH = 5;
export const SEARCH_LIMIT = 8;
/** Screen 0b: at most this many "Vouliez-vous dire" suggestions. */
export const SUGGESTION_LIMIT = 3;

/** Screen 0a: autocomplete. Only active establishments are returned. */
export async function searchEstablishments(
  query: string,
): Promise<EstablishmentSearchResult> {
  const terms = toSearchTerms(query);
  if (terms.length < SEARCH_MIN_LENGTH) {
    return { matchType: "establishment", results: [], suggestions: [] };
  }
  const fuzzy = terms.length >= FUZZY_MIN_LENGTH;
  const found = await db.searchActiveEstablishments(terms, SEARCH_LIMIT, fuzzy);
  if (found.results.length > 0 || !fuzzy) return found;
  return { ...found, suggestions: await db.findSimilarEstablishments(terms, SUGGESTION_LIMIT) };
}

/** Screen 0c: the sectors to choose from. */
export async function listSectors() {
  return db.listSectors();
}

/** Screen 0c: the types of every sector, shown once its sector is chosen. */
export async function listEstablishmentTypes() {
  return db.listEstablishmentTypes();
}

export async function getEstablishment(id: string) {
  const establishment = await db.findEstablishmentById(id);
  if (!establishment) throw notFound("Establishment not found");
  return establishment;
}

/** QR code scanned: the establishment (and possibly the service) is already known. */
export async function getEstablishmentByQrCode(code: string) {
  const found = await db.findEstablishmentByQrCode(normalizeQrCode(code));
  if (!found) throw notFound("QR code not found or inactive");
  return found;
}

/**
 * Screen 0c: establishment typed by the user when it is not in the registry.
 * Name and sector are required, and the type when the sector has types
 * (« Autre » accepted); it is stored as pending_review until an agent checks it.
 */
export async function createUserEstablishment(body: unknown): Promise<{ id: string }> {
  const input = asObject(body);
  const id = await db.insertUserEstablishment({
    rawInput: requireString(input, "name", { min: 3, max: 200 }),
    sectorCode: requireString(input, "sector", { max: 64 }),
    typeCode: optionalString(input, "type", { max: 64 }),
    municipalityInput: optionalString(input, "municipality", { max: 120 }),
  });
  return { id };
}
