import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Signed in for 7 days (decided 2026-10-07). */
export const SESSION_DAYS = 7;

const digest = (text: string) => createHash("sha256").update(text).digest();

/** Compared in constant time, whatever the lengths. */
export function isRightPassword(given: string, expected: string): boolean {
  return expected !== "" && timingSafeEqual(digest(given), digest(expected));
}

const signature = (expiresAt: number, secret: string) =>
  createHmac("sha256", secret).update(`admin-session:${expiresAt}`).digest("base64url");

/**
 * The session cookie's value: its expiry and a signature made with the
 * password itself, so changing the password in Vercel signs everyone out.
 */
export function createSessionToken(secret: string, now = Date.now()): string {
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function isValidSessionToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || secret === "") return false;
  const [expires, given] = token.split(".");
  const expiresAt = Number(expires);
  if (!given || !Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = Buffer.from(signature(expiresAt, secret));
  const received = Buffer.from(given);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
