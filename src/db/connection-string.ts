/**
 * Neon (and most hosts) give URLs with sslmode=require. The pg driver treats
 * prefer, require and verify-ca as verify-full today, but will switch to the
 * weaker libpq meaning (encrypted, server certificate not checked) in its next
 * major version, and warns about it. We make today's strict behaviour explicit.
 * Keep in sync with scripts/migrate.mjs.
 */
export function withStrictSsl(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  const mode = url.searchParams.get("sslmode");
  if (
    mode &&
    ["prefer", "require", "verify-ca"].includes(mode) &&
    !url.searchParams.has("uselibpqcompat")
  ) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}
