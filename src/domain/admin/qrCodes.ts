/**
 * QR codes of the back-office (asked by Olivia, 2026-10-10): one code per
 * place, or per counter (service, location in the place). The poster prints
 * it; the scan leads to /e/{code}, the place already known.
 */
import * as db from "../../db/qrCodes";
import { newQrCode, normalizeQrCode } from "../../lib/qr";
import { isUuid, requireUuid } from "../../lib/validation";
import { invalidInput, notFound } from "../errors";

export type { QrCodeRow, QrEstablishment, QrOrganization, QrPoster, QrSearchResult } from "../../db/qrCodes";

export const QR_SEARCH_MIN_LENGTH = 2;
export const QR_SEARCH_LIMIT = 30;
export const QR_LOCATION_MAX_LENGTH = 60;
/** At most this many posters printed at once. */
export const QR_POSTERS_MAX = 200;

export async function searchQrTargets(text: string): Promise<db.QrSearchResult | null> {
  const trimmed = text.trim();
  if (trimmed.length < QR_SEARCH_MIN_LENGTH) return null;
  return db.searchQrTargets(trimmed.slice(0, 100), QR_SEARCH_LIMIT);
}

export async function getQrEstablishment(id: string): Promise<db.QrEstablishment | null> {
  return isUuid(id) ? db.findQrEstablishment(id) : null;
}

export const getQrOrganization = (code: string) => db.findQrOrganization(code);

/** Draws codes until one is free (a repeat is very unlikely). */
async function insertWithNewCode(establishmentId: string, serviceId: number | null, locationLabel: string | null) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newQrCode();
    if (await db.insertQrCode({ code, establishmentId, serviceId, locationLabel })) return code;
  }
  throw new Error("No free QR code after 5 attempts");
}

/** A new code for a place; `serviceId` empty for the whole place. Returns the code. */
export async function createQrCode(establishmentId: string, input: { serviceId: string; locationLabel: string }) {
  const id = requireUuid(establishmentId, "establishmentId");
  const serviceId = input.serviceId.trim() === "" ? null : Number(input.serviceId);
  if (serviceId !== null && !Number.isInteger(serviceId)) throw invalidInput("serviceId must be a number");
  const location = input.locationLabel.trim();
  if (location.length > QR_LOCATION_MAX_LENGTH) throw invalidInput("location must be at most 60 characters");
  if (!(await db.canHaveQrCode(id, serviceId))) throw notFound("Place not found, or service not offered there");
  return insertWithNewCode(id, serviceId, location === "" ? null : location);
}

/** One code for each place of the organisation that has none. Returns the codes created. */
export async function createMissingOrganizationCodes(organizationCode: string): Promise<string[]> {
  const organization = await db.findQrOrganization(organizationCode);
  if (!organization) throw notFound("Organisation not found");
  const created: string[] = [];
  for (const site of organization.sites.filter((s) => s.activeCodes.length === 0)) {
    created.push(await insertWithNewCode(site.id, null, null));
  }
  return created;
}

/** A place of the organisation (an agency, a shop), named after its town or district. */
export async function addOrganizationSite(organizationCode: string, place: string): Promise<string> {
  const trimmed = place.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 100) throw invalidInput("place must be 2 to 100 characters");
  const id = await db.insertOrganizationSite(organizationCode, trimmed);
  if (!id) throw notFound("Organisation without « in general » establishment");
  return id;
}

/** Returns the place of the code, to go back to it. */
export async function setQrCodeActive(code: string, active: boolean): Promise<string> {
  const establishmentId = await db.setQrCodeActive(normalizeQrCode(code), active);
  if (!establishmentId) throw notFound("QR code not found");
  return establishmentId;
}

export async function listQrPosters(codes: string[]) {
  const unique = [...new Set(codes.map(normalizeQrCode).filter((c) => c !== ""))].slice(0, QR_POSTERS_MAX);
  return unique.length === 0 ? [] : db.listQrPosters(unique);
}
