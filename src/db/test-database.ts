/**
 * Tests only: an in-memory PostgreSQL (PGlite) with the real migration files
 * applied. No server needed.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pg_trgm, unaccent } });
  const dir = path.join(__dirname, "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  return db;
}
