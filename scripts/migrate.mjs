// Applies src/db/migrations/*.sql in name order, each in its own transaction.
// Applied files are recorded in schema_migration and never run twice.
// Usage: npm run db:migrate (reads .env.local if present).
//
// Uses DATABASE_URL_UNPOOLED when set: the advisory lock below needs a direct
// connection and does not work through a transaction pooler (Neon, Supabase).
//
// On Vercel, migrations run during the build of production deployments only:
// preview deployments share the same database and must not migrate it.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.join(import.meta.dirname, "..", "src", "db", "migrations");

if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log(`Skipping migrations on a ${process.env.VERCEL_ENV} deployment.`);
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  if (process.env.VERCEL) {
    // First deployments may happen before the database is connected.
    console.warn("No database configured on this deployment: skipping migrations.");
    process.exit(0);
  }
  console.error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set (see .env.example)");
  process.exit(1);
}

// Same as withStrictSsl() in src/db/connection-string.ts: keep pg's current
// strict SSL behaviour (verify-full) and silence its sslmode deprecation warning.
function withStrictSsl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  const mode = url.searchParams.get("sslmode");
  if (mode && ["prefer", "require", "verify-ca"].includes(mode) && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const client = new pg.Client({ connectionString: withStrictSsl(connectionString) });
await client.connect();

try {
  // Prevents two deployments from migrating at the same time.
  await client.query("SELECT pg_advisory_lock(hashtext('schema_migration'))");
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migration (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

  const { rows } = await client.query("SELECT name FROM schema_migration");
  const applied = new Set(rows.map((row) => row.name));
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migration (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Migration ${file} failed: ${error.message}`);
      process.exitCode = 1;
      break;
    }
    console.log(`Applied ${file}`);
    count += 1;
  }
  if (!process.exitCode) {
    console.log(count ? `${count} migration(s) applied.` : "Database is up to date.");
  }
} finally {
  await client.end();
}
