import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSessionToken } from "@/src/domain/admin";

export const SESSION_COOKIE = "nx_admin";
export const SIGN_IN_PATH = "/console-bo/connexion";

/** The password, set in Vercel (ADMIN_PASSWORD); empty when not set: nobody can sign in. */
export const adminPassword = () => process.env.ADMIN_PASSWORD ?? "";

export async function isSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return isValidSessionToken(token, adminPassword());
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
