import { timingSafeEqual } from "node:crypto";

/**
 * Scheduled jobs are called by Vercel Cron with the header
 * "Authorization: Bearer <CRON_SECRET>". Anyone else gets a 401.
 * Without CRON_SECRET configured, every call is refused.
 */
export function isAuthorizedCronCall(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
