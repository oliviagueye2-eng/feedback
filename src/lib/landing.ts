/**
 * Pre-launch: the main domain shows only the landing page, while the Vercel
 * address keeps the whole site for tests (Olivia's choice, 2026-10-05).
 * On launch day, empty LANDING_HOSTS: the main domain then shows the whole site.
 */
export const LANDING_HOSTS = ["neexnaxari.com", "www.neexnaxari.com"];

/** The landing page's own route, shown at "/" on the main domain. */
export const LANDING_PATH = "/lancement";

/** The legal pages stay reachable on the main domain, from the landing's footer. */
export const LEGAL_PATHS = ["/mentions-legales", "/confidentialite", "/conditions-utilisation"];

/** The back-office, reachable on the main domain too (Olivia's choice, 2026-10-07). */
export const BACK_OFFICE_PATH = "/console-bo";

/**
 * What to do with a page request:
 * - "landing": show the landing page in place (main domain, "/");
 * - "to-landing": send to "/" (main domain, any other page);
 * - "site": the whole site, hidden from search engines (test address), or a
 *   legal page or the back-office on the main domain.
 */
export type LandingRoute = "landing" | "to-landing" | "site";

export function routeRequest(host: string | null, pathname: string): LandingRoute {
  const hostname = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  if (!LANDING_HOSTS.includes(hostname)) return "site";
  if (pathname === "/") return "landing";
  if (pathname === BACK_OFFICE_PATH || pathname.startsWith(`${BACK_OFFICE_PATH}/`)) return "site";
  return LEGAL_PATHS.includes(pathname) ? "site" : "to-landing";
}
