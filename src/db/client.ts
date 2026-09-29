import { Pool } from "pg";

let pool: Pool | null = null;

/** Shared PostgreSQL connection pool, created on first use. */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set (see .env.example)");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}
