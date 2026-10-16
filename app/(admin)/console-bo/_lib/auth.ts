import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSessionToken, isValidTestModeToken } from "@/src/domain/admin";

export const SESSION_COOKIE = "nx_admin";
/** Test mode (asked by Olivia, 2026-10-16): on the whole site, so that the feedback pages read it. */
export const TEST_MODE_COOKIE = "nx_test";
export const SIGN_IN_PATH = "/console-bo/connexion";

/** The password, set in Vercel (ADMIN_PASSWORD); empty when not set: nobody can sign in. */
export const adminPassword = () => process.env.ADMIN_PASSWORD ?? "";

export async function isSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return isValidSessionToken(token, adminPassword());
}

/** This browser sends test feedbacks: the test mode was turned on here less than 7 days ago. */
export async function isTestDevice(): Promise<boolean> {
  const token = (await cookies()).get(TEST_MODE_COOKIE)?.value;
  return isValidTestModeToken(token, adminPassword());
}

/** Every back-office page and action starts here: not signed in, to the sign-in page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) redirect(SIGN_IN_PATH);
}

/** The visitor's address, as Vercel passes it on (first of x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}
