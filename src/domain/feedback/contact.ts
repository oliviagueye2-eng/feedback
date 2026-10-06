import type { FeedbackContact } from "../../db/feedbacks";
import { invalidInput } from "../errors";

export const CONTACT_MAX_LENGTH = 254;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Senegalese numbers: mobiles 70, 71, 75, 76, 77, 78; fixed lines 30, 33. */
const PHONE_RE = /^(7[015678]|3[03])\d{7}$/;

/**
 * Last screen: « Votre e-mail ou votre numéro de téléphone », in one field.
 * With an @ it is an e-mail (kept in lower case); otherwise a Senegalese
 * number, written with or without +221 / 00221, spaces, dots or dashes (kept
 * as +221 and 9 digits). Nothing is sent to check it (no code, 2026-10-05).
 */
export function parseContact(raw: string): FeedbackContact {
  const text = raw.trim();
  if (text === "" || text.length > CONTACT_MAX_LENGTH) throw invalidInput("contact is required");
  if (text.includes("@")) {
    if (!EMAIL_RE.test(text)) throw invalidInput("contact is not a valid e-mail");
    return { kind: "email", value: text.toLowerCase() };
  }
  const digits = text.replace(/[\s.\-()]/g, "").replace(/^(\+|00)221/, "");
  if (!PHONE_RE.test(digits)) throw invalidInput("contact is not a valid Senegalese phone number");
  return { kind: "phone", value: `+221${digits}` };
}
