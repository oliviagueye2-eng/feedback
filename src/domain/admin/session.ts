import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Signed in for 7 days (decided 2026-10-07). */
export const SESSION_DAYS = 7;

const digest = (text: string) => createHash("sha256").update(text).digest();

/** Compared in constant time, whatever the lengths. */
export function isRightPassword(given: string, expected: string): boolean {
  return expected !== "" && timingSafeEqual(digest(given), digest(expected));
}

/** Test mode on a browser for 7 days, as long as a sign-in (decided 2026-10-16). */
export const TEST_MODE_DAYS = 7;

/** What a token opens: its signature differs, so one never stands for the other. */
type Purpose = "admin-session" | "test-mode";

const signature = (purpose: Purpose, expiresAt: number, secret: string) =>
  createHmac("sha256", secret).update(`${purpose}:${expiresAt}`).digest("base64url");

const createToken = (purpose: Purpose, days: number, secret: string, now: number) => {
  const expiresAt = now + days * 24 * 60 * 60 * 1000;
  return `${expiresAt}.${signature(purpose, expiresAt, secret)}`;
};

function isValidToken(purpose: Purpose, token: string | undefined, secret: string, now: number): boolean {
  if (!token || secret === "") return false;
  const [expires, given] = token.split(".");
  const expiresAt = Number(expires);
  if (!given || !Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = Buffer.from(signature(purpose, expiresAt, secret));
  const received = Buffer.from(given);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * The session cookie's value: its expiry and a signature made with the
 * password itself, so changing the password in Vercel signs everyone out.
 */
export const createSessionToken = (secret: string, now = Date.now()) => createToken("admin-session", SESSION_DAYS, secret, now);

export const isValidSessionToken = (token: string | undefined, secret: string, now = Date.now()) =>
  isValidToken("admin-session", token, secret, now);

/**
 * The test mode cookie's value, signed the same way: nobody can mark a
 * feedback as a test without the password, and changing it ends every test mode.
 */
export const createTestModeToken = (secret: string, now = Date.now()) => createToken("test-mode", TEST_MODE_DAYS, secret, now);

export const isValidTestModeToken = (token: string | undefined, secret: string, now = Date.now()) =>
  isValidToken("test-mode", token, secret, now);
