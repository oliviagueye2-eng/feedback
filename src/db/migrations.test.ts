/**
 * Applies the real migration files to an in-memory PostgreSQL (PGlite) and
 * checks the behaviour the application relies on. No server needed.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { normalizeForSearch, toSearchTerms } from "../lib/text";
import { createTestDatabase } from "./test-database";

let db: PGlite;

const one = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows[0];

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(`
    INSERT INTO region (code, name) VALUES ('DK', 'Dakar');
    INSERT INTO department (region_id, code, name) SELECT id, 'DK1', 'Dakar' FROM region WHERE code = 'DK';
    INSERT INTO municipality (department_id, code, name) SELECT id, 'GY', 'Grand-Yoff' FROM department WHERE code = 'DK1';
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("reference data", () => {
  it("has the essential question with five options and follow-up prompts", async () => {
    const row = await one<{ options: number; prompts: number }>(`
      SELECT count(DISTINCT ao.id)::int AS options,
             count(t.follow_up_prompt)::int AS prompts
      FROM question q
      JOIN answer_option ao ON ao.question_id = q.id
      LEFT JOIN answer_option_translation t ON t.answer_option_id = ao.id AND t.language = 'fr'
      WHERE q.code = 'OVERALL_SATISFACTION'`);
    expect(row).toEqual({ options: 5, prompts: 5 });
  });

  it("has the nineteen sectors, each with a French label", async () => {
    const row = await one<{ sectors: number; labelled: number; old_code: number }>(`
      SELECT count(*)::int AS sectors,
             count(t.label)::int AS labelled,
             count(*) FILTER (WHERE s.code = 'PUBLIC_TRANSPORT')::int AS old_code
      FROM sector s
      LEFT JOIN sector_translation t ON t.sector_id = s.id AND t.language = 'fr'`);
    expect(row).toEqual({ sectors: 19, labelled: 19, old_code: 0 });
  });

  it("shows the ten common topics everywhere, plus each sector's own, « Autre » last", async () => {
    // Rule of topic_sector: a topic without rows is common; with rows, only in those sectors.
    const topicsFor = async (sector: string) =>
      (await db.query<{ code: string; label: string }>(`
        SELECT t.code, tr.label
        FROM topic t
        JOIN topic_translation tr ON tr.topic_id = t.id AND tr.language = 'fr'
        WHERE t.is_active
          AND (NOT EXISTS (SELECT 1 FROM topic_sector ts WHERE ts.topic_id = t.id)
               OR EXISTS (SELECT 1 FROM topic_sector ts JOIN sector s ON s.id = ts.sector_id
                          WHERE ts.topic_id = t.id AND s.code = $1))
        ORDER BY t.position`, [sector])).rows;

    const common = await topicsFor("RETAIL");
    expect(common.map((t) => t.label)).toEqual([
      "Accueil et politesse",
      "Professionnalisme du personnel",
      "Temps d'attente",
      "Explications reçues",
      "Simplicité de la démarche (papiers, allers-retours)",
      "Horaires d'ouverture",
      "Frais payés (montant, reçu)",
      "Propreté et confort des locaux",
      "Accès pour tous (personnes handicapées, âgées)",
      "Autre",
    ]);

    const electricity = (await topicsFor("ELECTRICITY")).map((t) => t.code);
    expect(electricity).toHaveLength(14);
    expect(electricity.slice(9)).toEqual(["POWER_CUTS", "INTERVENTION_TIME", "BILLING", "CUSTOMER_SERVICE", "OTHER"]);
    expect((await topicsFor("BANKING_INSURANCE")).map((t) => t.code).slice(9)).toEqual([
      "PROCESSING_TIME", "CASE_TRACKING", "CUSTOMER_SERVICE", "OTHER",
    ]);
    expect(await topicsFor("HEALTH")).toHaveLength(13);
  });

  it("gives health its published detailed questionnaire, every option labelled", async () => {
    const questions = (await db.query<{ code: string; label: string; options: number; labelled: number }>(
      `SELECT q.code, qt.label, count(ao.id)::int AS options, count(ot.label)::int AS labelled
       FROM sector s
       JOIN questionnaire qn ON qn.id = s.fallback_questionnaire_id AND qn.status = 'published'
       JOIN question q ON q.questionnaire_id = qn.id
       JOIN question_translation qt ON qt.question_id = q.id AND qt.language = 'fr'
       JOIN answer_option ao ON ao.question_id = q.id
       LEFT JOIN answer_option_translation ot ON ot.answer_option_id = ao.id AND ot.language = 'fr'
       WHERE s.code = 'HEALTH'
       GROUP BY q.code, qt.label, q.position ORDER BY q.position`)).rows;
    expect(questions.map((q) => [q.code, q.options])).toEqual([
      ["PATIENT", 3], ["GOAL_ACHIEVED", 3], ["WAIT_TIME", 5], ["PRESCRIPTION_AVAILABLE", 4], ["RECEIPT_GIVEN", 4],
    ]);
    expect(questions.every((q) => q.labelled === q.options)).toBe(true);
    expect(questions[0]!.label).toBe("Pour qui êtes-vous venu(e) ?");
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
      "INSERT INTO service_translation (service_id, language, label) VALUES ($1, 'fr', 'État civil')",
      [id],
    );
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM service WHERE id = $1", [id]))?.search_text,
    ).toBe("etat civil extrait de naissance");
  });

  it("has the common questions, shown only after a dissatisfied answer, « Pourquoi ? » after « Non »", async () => {
    const conditions = (await db.query<{ question: string; depends_on: string; option: string }>(
      `SELECT q.code AS question, dq.code AS depends_on, ao.code AS option
       FROM question_condition qc
       JOIN question q ON q.id = qc.question_id
       JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'COMMON' AND qn.status = 'published'
       JOIN question dq ON dq.id = qc.depends_on_question_id
       JOIN answer_option ao ON ao.id = qc.option_id
       ORDER BY q.position, ao.position`)).rows;
    expect(conditions).toEqual([
      { question: "REPORTED", depends_on: "OVERALL_SATISFACTION", option: "DISSATISFIED" },
      { question: "REPORTED", depends_on: "OVERALL_SATISFACTION", option: "VERY_DISSATISFIED" },
      { question: "REPORT_WHY", depends_on: "REPORTED", option: "NO" },
    ]);
    // A condition on an answer of another question is refused.
    await expect(db.query(
      `INSERT INTO question_condition (question_id, depends_on_question_id, option_id)
       SELECT q.id, dq.id, (SELECT id FROM answer_option WHERE code = 'POINTLESS')
       FROM question q, question dq WHERE q.code = 'REPORT_WHY' AND dq.code = 'OVERALL_SATISFACTION'`,
    )).rejects.toThrow(/foreign key/);
  });

  it("moved every text to the translation tables (0013), the old table is gone", async () => {
    const row = await one<{ sectors: number; topics: number; questions: number; options: number; prompts: number; old: string | null }>(`
      SELECT (SELECT count(*)::int FROM sector_translation) AS sectors,
             (SELECT count(*)::int FROM topic_translation) AS topics,
             (SELECT count(*)::int FROM question_translation) AS questions,
             (SELECT count(*)::int FROM answer_option_translation) AS options,
             (SELECT count(follow_up_prompt)::int FROM answer_option_translation) AS prompts,
             to_regclass('translation')::text AS old`);
    // Questions and options: those of 0002 and 0012, plus the common ones of 0014 (2 and 7).
    expect(row).toEqual({ sectors: 19, topics: 33, questions: 8, options: 31, prompts: 5, old: null });
    // The real service of 0004 keeps its French label (then its synonyms) in its search_text.
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM service WHERE code = 'CIVIL_REGISTRY'"))?.search_text,
    ).toMatch(/^etat civil extrait de naissance /);
  });

  it("refuses a text for a row that does not exist, and removes it with its row", async () => {
    await expect(db.query(
      "INSERT INTO topic_translation (topic_id, language, label) VALUES (32000, 'fr', 'Fantôme')",
    )).rejects.toThrow(/foreign key/);
    const { id } = (await one<{ id: number }>(
      "INSERT INTO topic (code, position) VALUES ('TEMPORARY', 98) RETURNING id"))!;
    await db.query("INSERT INTO topic_translation (topic_id, language, label) VALUES ($1, 'fr', 'Temporaire')", [id]);
    await db.query("DELETE FROM topic WHERE id = $1", [id]);
    expect((await one<{ n: number }>(
      "SELECT count(*)::int AS n FROM topic_translation WHERE topic_id = $1", [id]))?.n).toBe(0);
  });

  it("drops stop words and replaces equivalents exactly like src/lib/text.ts", async () => {
    for (const sample of [
      "Orange Sénégal", "Institution de prévoyance retraite du Sénégal", "Sénégal", "Sen'Eau",
      "Hôtel de Ville de Dakar", "hotel de ville", "Hôtel-de-Ville du Sénégal",
    ]) {
      const row = await one<{ t: string }>("SELECT search_terms($1) AS t", [sample]);
      expect(row?.t).toBe(toSearchTerms(sample));
    }
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
