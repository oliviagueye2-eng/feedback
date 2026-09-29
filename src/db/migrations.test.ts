/**
 * Applies the real migration files to an in-memory PostgreSQL (PGlite) and
 * checks the behaviour the application relies on. No server needed.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { normalizeForSearch } from "../lib/text";

const dir = path.join(__dirname, "migrations");
let db: PGlite;

const one = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows[0];

beforeAll(async () => {
  db = new PGlite({ extensions: { pg_trgm, unaccent } });
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  await db.exec(`
    INSERT INTO region (code, name) VALUES ('DK', 'Dakar');
    INSERT INTO department (region_id, code, name) SELECT id, 'DK1', 'Dakar' FROM region;
    INSERT INTO municipality (department_id, code, name) SELECT id, 'GY', 'Grand-Yoff' FROM department;
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("reference data", () => {
  it("has the essential question with five options and follow-up prompts", async () => {
    const row = await one<{ options: number; prompts: number }>(`
      SELECT count(DISTINCT ao.id)::int AS options,
             count(t.text) FILTER (WHERE t.field = 'follow_up_prompt')::int AS prompts
      FROM question q
      JOIN answer_option ao ON ao.question_id = q.id
      LEFT JOIN translation t ON t.target_table = 'answer_option' AND t.target_id = ao.id
      WHERE q.code = 'OVERALL_SATISFACTION'`);
    expect(row).toEqual({ options: 5, prompts: 5 });
  });

  it("has the eighteen sectors, each with a French label", async () => {
    const row = await one<{ sectors: number; labelled: number; old_code: number }>(`
      SELECT count(*)::int AS sectors,
             count(t.text)::int AS labelled,
             count(*) FILTER (WHERE s.code = 'PUBLIC_TRANSPORT')::int AS old_code
      FROM sector s
      LEFT JOIN translation t ON t.target_table = 'sector' AND t.target_id = s.id AND t.language = 'fr'`);
    expect(row).toEqual({ sectors: 18, labelled: 18, old_code: 0 });
  });

  it("has the nine topics", async () => {
    const row = await one<{ n: number }>("SELECT count(*)::int AS n FROM topic");
    expect(row?.n).toBe(9);
  });
});

describe("search", () => {
  it("keeps establishment.search_text in sync with name and aliases", async () => {
    const { id } = (await one<{ id: string }>(
      `INSERT INTO establishment (name, aliases) VALUES ($1, $2) RETURNING id`,
      ["Hôpital Aristide Le Dantec", ["Le Dantec"]],
    ))!;
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM establishment WHERE id = $1", [id]))?.search_text,
    ).toBe("hopital aristide le dantec le dantec");

    await db.query("UPDATE establishment SET aliases = $1 WHERE id = $2", [["CHU Le Dantec"], id]);
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM establishment WHERE id = $1", [id]))?.search_text,
    ).toBe("hopital aristide le dantec chu le dantec");
  });

  it("adds a service's French label to its search_text when the label arrives later", async () => {
    const { id } = (await one<{ id: number }>(`
      INSERT INTO service (code, sector_id, synonyms)
      SELECT 'CIVIL_REGISTRY_BIRTH', id, '{extrait de naissance}' FROM sector WHERE code = 'ADMINISTRATION'
      RETURNING id`))!;
    await db.query(
      "INSERT INTO translation (target_table, target_id, language, text) VALUES ('service', $1, 'fr', 'État civil')",
      [id],
    );
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM service WHERE id = $1", [id]))?.search_text,
    ).toBe("etat civil extrait de naissance");
  });

  it("normalizes text exactly like src/lib/text.ts", async () => {
    for (const sample of ["État Civil", "Mairie de Grand-Yoff", "Œuvre sociale", "Poste de santé n°2"]) {
      const row = await one<{ n: string }>("SELECT normalize_search($1) AS n", [sample]);
      expect(row?.n).toBe(normalizeForSearch(sample));
    }
  });
});

describe("collection rules", () => {
  let establishmentId: string;
  const feedbackId = "2f1c7a3e-8b4d-4c1a-9e2f-5a6b7c8d9e0f";

  beforeAll(async () => {
    establishmentId = (await one<{ id: string }>(
      "INSERT INTO establishment (name) VALUES ('Centre d''état civil de Grand-Yoff') RETURNING id",
    ))!.id;
  });

  it("requires visit_month for a recent visit", async () => {
    await expect(
      db.query(
        "INSERT INTO feedback (id, establishment_id, channel, language, visit_period) VALUES (gen_random_uuid(), $1, 'qr', 'fr', 'today')",
        [establishmentId],
      ),
    ).rejects.toThrow(/feedback_check/);
  });

  it("rejects an answer option that belongs to another question", async () => {
    await db.query(
      "INSERT INTO feedback (id, establishment_id, channel, language) VALUES ($1, $2, 'search', 'fr')",
      [feedbackId, establishmentId],
    );
    await expect(
      db.query(`
        INSERT INTO answer (feedback_id, question_id, option_id)
        SELECT $1, q.id, 999999 FROM question q WHERE q.code = 'OVERALL_SATISFACTION'`,
        [feedbackId],
      ),
    ).rejects.toThrow(/answer_option_id_question_id_fkey/);
  });

  it("publishes monthly stats and follows merged establishments", async () => {
    const recent = "8a1b2c3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d";
    const merged = (await one<{ id: string }>(
      `INSERT INTO establishment (name, source, raw_input) VALUES ('etat civil gy', 'user', 'etat civil gy') RETURNING id`,
    ))!.id;
    await db.query(
      "UPDATE establishment SET status = 'merged', merged_into_id = $1 WHERE id = $2",
      [establishmentId, merged],
    );
    await db.query(
      `INSERT INTO feedback (id, establishment_id, channel, language, visit_period, visit_month)
       VALUES ($1, $2, 'qr', 'fr', 'today', '2026-03-01')`,
      [recent, merged],
    );
    await db.query(
      `INSERT INTO answer (feedback_id, question_id, option_id)
       SELECT $1, q.id, ao.id FROM question q JOIN answer_option ao ON ao.question_id = q.id
       WHERE q.code = 'OVERALL_SATISFACTION' AND ao.code = 'SATISFIED'`,
      [recent],
    );
    await db.exec("REFRESH MATERIALIZED VIEW monthly_stats");
    const row = await one<{ establishment_id: string; feedback_count: number; avg_satisfaction: string }>(
      "SELECT establishment_id, feedback_count, avg_satisfaction FROM monthly_stats",
    );
    expect(row).toEqual({
      establishment_id: establishmentId,
      feedback_count: 1,
      avg_satisfaction: "4.00",
    });
  });
});
