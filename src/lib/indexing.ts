/** The public addresses of the site: the only ones search engines may index. */
export const MAIN_HOSTS = ["neexnaqari.com", "www.neexnaqari.com"];

/**
 * Whether search engines may index a page served under this host. The Vercel
 * test address keeps the whole site too, but must stay out of search results
 * (it would compete with neexnaqari.com).
 */
export function isIndexableHost(host: string | null): boolean {
  const hostname = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  return MAIN_HOSTS.includes(hostname);
}
