import { Pool } from "pg";
import { invalidInput, notFound } from "../domain/errors";
import { withStrictSsl } from "./connection-string";

/** What the queries need: node-postgres Pool in production, PGlite in tests. */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

let pool: Pool | null = null;
let testDatabase: Queryable | null = null;

/** Shared PostgreSQL connection pool, created on first use. */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set (see .env.example)");
    }
    pool = new Pool({ connectionString: withStrictSsl(connectionString) });
  }
  return pool;
}

/** Tests only: run every query on this database instead of DATABASE_URL. */
export function useTestDatabase(db: Queryable | null): void {
  testDatabase = db;
}

/**
 * Runs one SQL statement and returns its rows. Each statement is atomic on its
 * own, which is all the writes need (they are single upserts), and it works
 * with Neon's pooled connections.
 */
export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  try {
    const db: Queryable = testDatabase ?? getPool();
    const result = await db.query(text, params);
    return result.rows as T[];
  } catch (error) {
    throw translateError(error);
  }
}

/** Turns errors caused by the request's content into business errors (4xx). */
function translateError(error: unknown): unknown {
  const code = (error as { code?: unknown }).code;
  const constraint = String((error as { constraint?: unknown }).constraint ?? "");
  if (code === "23503") {
    // The parent row (feedback) is what the URL names: 404. Anything else is a bad id in the body.
    return constraint.endsWith("_feedback_id_fkey")
      ? notFound("Feedback not found")
      : invalidInput("Unknown reference");
  }
  if (code === "22P02") return invalidInput("Invalid identifier");
  return error;
}
