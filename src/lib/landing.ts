/**
 * Pre-launch: the main domain shows only the landing page, while the Vercel
 * address keeps the whole site for tests (Olivia's choice, 2026-10-05).
 * On launch day, empty LANDING_HOSTS: the main domain then shows the whole site.
 */
export const LANDING_HOSTS = ["neexnaxari.com", "www.neexnaxari.com"];

/** The landing page's own route, shown at "/" on the main domain. */
export const LANDING_PATH = "/lancement";

/**
 * What to do with a page request:
 * - "landing": show the landing page in place (main domain, "/");
 * - "to-landing": send to "/" (main domain, any other page);
 * - "site": the whole site, hidden from search engines (test address).
 */
export type LandingRoute = "landing" | "to-landing" | "site";

export function routeRequest(host: string | null, pathname: string): LandingRoute {
  const hostname = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  if (!LANDING_HOSTS.includes(hostname)) return "site";
  return pathname === "/" ? "landing" : "to-landing";
}
