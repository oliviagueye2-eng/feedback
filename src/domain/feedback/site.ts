import * as establishments from "../../db/establishments";
import * as db from "../../db/feedbacks";
import { requireUuid } from "../../lib/validation";
import { invalidInput, notFound } from "../errors";

/** The place typed on « Dans quelle agence ? ». */
export const SITE_PLACE_MIN_LENGTH = 2;
export const SITE_PLACE_MAX_LENGTH = 120;

/**
 * « Dans quelle agence ? », asked after screen 1 when the feedback is given to
 * an organisation « in general » for a service done in one of its agencies.
 * Not asked when an agency was chosen in the search.
 */
export async function needsSiteStep(feedbackId: string): Promise<boolean> {
  const step = await establishments.findSiteStep(requireUuid(feedbackId, "id"));
  return step !== null && step.currentId === step.generalId;
}

/** The screen: the organisation and its agencies. Not found when the feedback asks no agency. */
export async function getSiteScreen(feedbackId: string) {
  const step = await establishments.findSiteStep(requireUuid(feedbackId, "id"));
  if (!step) throw notFound("No agency to choose for this feedback");
  return step;
}

/** An agency of the list, or the organisation « in general » (« Je ne sais plus »). */
export async function chooseSite(feedbackId: string, establishmentId: string): Promise<void> {
  requireUuid(feedbackId, "id");
  requireUuid(establishmentId, "establishmentId");
  if (!(await db.moveFeedbackWithinOrganization(feedbackId, establishmentId))) {
    throw invalidInput("Not an establishment of the feedback's organisation");
  }
}

/** The agency typed: found by its place, or added (pending review). */
export async function addSite(feedbackId: string, place: string): Promise<void> {
  requireUuid(feedbackId, "id");
  const trimmed = place.trim().replace(/\s+/g, " ");
  if (trimmed.length < SITE_PLACE_MIN_LENGTH || trimmed.length > SITE_PLACE_MAX_LENGTH) {
    throw invalidInput(`place must be ${SITE_PLACE_MIN_LENGTH} to ${SITE_PLACE_MAX_LENGTH} characters`);
  }
  const id = await establishments.findOrInsertUserSite(feedbackId, trimmed);
  await chooseSite(feedbackId, id);
}
