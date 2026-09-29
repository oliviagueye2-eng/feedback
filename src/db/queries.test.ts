/**
 * Runs the data access code (src/db) through the business functions
 * (src/domain) against an in-memory PostgreSQL with the real migrations.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createUserEstablishment,
  getEstablishment,
  getEstablishmentByQrCode,
  getEstablishmentStats,
  listSectors,
  searchEstablishments,
} from "../domain/establishment";
import {
  getDetailedQuestionnaire,
  saveAnswer,
  saveComment,
  saveTopics,
  upsertFeedback,
} from "../domain/feedback";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;
const ids: Record<string, string> = {};

const rows = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
  await db.exec(`
    INSERT INTO region (code, name) VALUES ('DK', 'Dakar');
    INSERT INTO department (region_id, code, name) SELECT id, 'DK1', 'Dakar' FROM region;
    INSERT INTO municipality (department_id, code, name)
    SELECT id, v.code, v.name FROM department, (VALUES
      ('GY', 'Grand-Yoff'), ('PA', 'Parcelles Assainies'), ('FN', 'Fann-Point E-Amitié')) AS v (code, name);

    INSERT INTO establishment_type (code, sector_id)
    SELECT v.code, s.id FROM (VALUES
      ('CIVIL_REGISTRY_CENTER', 'ADMINISTRATION'), ('HOSPITAL', 'HEALTH')) AS v (code, sector)
    JOIN sector s ON s.code = v.sector;

    INSERT INTO service (code, sector_id, synonyms)
    SELECT 'CIVIL_REGISTRY_BIRTH', id, '{extrait de naissance}' FROM sector WHERE code = 'ADMINISTRATION';
    INSERT INTO translation (target_table, target_id, language, text)
    SELECT 'service', id, 'fr', 'État civil' FROM service WHERE code = 'CIVIL_REGISTRY_BIRTH';
  `);

  const add = async (key: string, name: string, aliases: string[], municipality: string | null, type: string, status = "active") => {
    const [row] = await rows<{ id: string }>(
      `INSERT INTO establishment (name, aliases, municipality_id, type_id, status, closed_at)
       VALUES ($1, $2, (SELECT id FROM municipality WHERE code = $3),
               (SELECT id FROM establishment_type WHERE code = $4), $5,
               CASE WHEN $5 = 'closed' THEN now() END)
       RETURNING id`,
      [name, aliases, municipality, type, status],
    );
    ids[key] = row!.id;
  };
  await add("gy", "Centre d'état civil de Grand-Yoff", ["mairie de Grand-Yoff"], "GY", "CIVIL_REGISTRY_CENTER");
  await add("pa", "Centre d'état civil des Parcelles Assainies", [], "PA", "CIVIL_REGISTRY_CENTER");
  await add("dantec", "Centre hospitalier universitaire Aristide Le Dantec", ["Le Dantec"], "FN", "HOSPITAL");
  await add("closed", "Centre d'état civil fermé", [], "GY", "CIVIL_REGISTRY_CENTER", "closed");
  await db.exec(`
    INSERT INTO establishment_service (establishment_id, service_id)
    SELECT e.id, s.id FROM establishment e, service s
    WHERE e.type_id = (SELECT id FROM establishment_type WHERE code = 'CIVIL_REGISTRY_CENTER');
    INSERT INTO qr_code (code, establishment_id, service_id)
    SELECT 'GY-EC-1', '${ids.gy}', id FROM service WHERE code = 'CIVIL_REGISTRY_BIRTH';
    INSERT INTO qr_code (code, establishment_id, is_active) VALUES ('OLD-1', '${ids.gy}', false);
  `);
}, 60_000);

afterAll(async () => {
  useTestDatabase(null);
  await db?.close();
});

describe("search", () => {
  it("finds an establishment by an alias, with a typo and without accents", async () => {
    const result = await searchEstablishments("le dantek");
    expect(result.matchType).toBe("establishment");
    expect(result.results[0]).toEqual({
      id: ids.dantec,
      name: "Centre hospitalier universitaire Aristide Le Dantec",
      municipalityName: "Fann-Point E-Amitié",
      typeCode: "HOSPITAL",
      sectorLabel: "Santé",
    });
  });

  it("recognises a service and lists the establishments offering it, never a closed one", async () => {
    const result = await searchEstablishments("extrait de naissance");
    expect(result.matchType).toBe("service");
    expect(result.results.map((e) => e.id).sort()).toEqual([ids.gy, ids.pa].sort());
  });

  it("puts establishments of the municipality named in the query first", async () => {
    const result = await searchEstablishments("État civil Parcelles Assainies");
    expect(result.matchType).toBe("service");
    expect(result.results.map((e) => e.id)).toEqual([ids.pa, ids.gy]);
  });

  it("returns nothing for an unknown place", async () => {
    expect(await searchEstablishments("boulangerie")).toEqual({
      matchType: "establishment",
      results: [],
      suggestions: [],
    });
  });

  it("suggests close names when nothing matches (Vouliez-vous dire)", async () => {
    const result = await searchEstablishments("hopitl dantek fan");
    expect(result.results).toEqual([]);
    expect(result.suggestions.map((e) => e.id)).toEqual([ids.dantec]);
  });
});

describe("establishment", () => {
  it("reads an establishment with its services", async () => {
    const e = await getEstablishment(ids.gy!);
    expect(e.name).toBe("Centre d'état civil de Grand-Yoff");
    expect(e.services.map((s) => s.code)).toEqual(["CIVIL_REGISTRY_BIRTH"]);
  });

  it("does not offer a closed establishment", async () => {
    await expect(getEstablishment(ids.closed!)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("finds the establishment and the service behind an active QR code only", async () => {
    const found = await getEstablishmentByQrCode("GY-EC-1");
    expect(found.establishment.id).toBe(ids.gy);
    expect(found.serviceId).toEqual(expect.any(Number));
    await expect(getEstablishmentByQrCode("OLD-1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("stores an establishment typed by the user as pending review, out of the search", async () => {
    const { id } = await createUserEstablishment({
      name: "Mairie de Ndiarème",
      sector: "ADMINISTRATION",
      municipality: "Guédiawaye",
    });
    const [row] = await rows(
      "SELECT status, source, raw_input, municipality_input FROM establishment WHERE id = $1",
      [id],
    );
    expect(row).toEqual({
      status: "pending_review",
      source: "user",
      raw_input: "Mairie de Ndiarème",
      municipality_input: "Guédiawaye",
    });
    expect((await searchEstablishments("Ndiarème")).results).toEqual([]);
    const created = await getEstablishment(id);
    expect(created.name).toBe("Mairie de Ndiarème");
    expect(created.sectorLabel).toBe("Administration et état civil");
    expect(created.municipalityName).toBe("Guédiawaye");
  });

  it("accepts an establishment without sector, and rejects an unknown sector", async () => {
    const { id } = await createUserEstablishment({ name: "Boutique de Fatou" });
    expect((await getEstablishment(id)).sectorLabel).toBeNull();
    await expect(createUserEstablishment({ name: "Mairie X", sector: "SPACE" })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("lists the eighteen sectors in alphabetical order, accents ignored", async () => {
    const sectors = await listSectors();
    expect(sectors).toHaveLength(18);
    expect(sectors.slice(0, 3).map((s) => s.label)).toEqual([
      "Administration et état civil",
      "Banques et assurances",
      "Commerce",
    ]);
    // "Eau et électricité" < "Éducation" < "Emploi…": the accent does not push it to the end.
    expect(sectors.findIndex((s) => s.label === "Éducation")).toBe(5);
  });
});

describe("feedback", () => {
  const feedbackId = "5b0c9d2e-1f3a-4b5c-8d6e-7f8091a2b3c4";

  it("creates the feedback, and a retry the next month keeps its visit month", async () => {
    const body = { channel: "search", establishmentId: ids.gy, language: "fr", visitPeriod: "under_week" };
    await upsertFeedback(feedbackId, body, new Date("2026-03-31T22:10:00Z"));
    await upsertFeedback(feedbackId, body, new Date("2026-04-01T08:00:00Z"));
    const [row] = await rows<{ visit_month: string; started_at: string }>(
      "SELECT to_char(visit_month, 'YYYY-MM-DD') AS visit_month, started_at::text FROM feedback WHERE id = $1",
      [feedbackId],
    );
    expect(row).toEqual({ visit_month: "2026-03-01", started_at: "2026-03-31 22:00:00+00" });
  });

  it("refuses feedback for a closed establishment", async () => {
    await expect(
      upsertFeedback("6c1d0e3f-2a4b-4c6d-9e7f-8091a2b3c4d5", {
        channel: "search", establishmentId: ids.closed, language: "fr", visitPeriod: "today",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("saves the essential answer and replaces it when the user changes their mind", async () => {
    await saveAnswer(feedbackId, "OVERALL_SATISFACTION", { option: "SATISFIED" });
    await saveAnswer(feedbackId, "OVERALL_SATISFACTION", { option: "DISSATISFIED" });
    const answers = await rows<{ code: string }>(
      "SELECT ao.code FROM answer a JOIN answer_option ao ON ao.id = a.option_id WHERE a.feedback_id = $1",
      [feedbackId],
    );
    expect(answers).toEqual([{ code: "DISSATISFIED" }]);
  });

  it("rejects an unknown option, an unknown question and an unknown feedback", async () => {
    await expect(saveAnswer(feedbackId, "OVERALL_SATISFACTION", { option: "YES" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(saveAnswer(feedbackId, "NOT_A_QUESTION", { option: "YES" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(saveAnswer("7d2e1f40-3b5c-4d7e-8f80-91a2b3c4d5e6", "OVERALL_SATISFACTION", { option: "SATISFIED" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("uses the sector's detailed questionnaire and records it on the feedback", async () => {
    await db.exec(`
      INSERT INTO questionnaire (code, status, published_at) VALUES ('ADMINISTRATION', 'published', now());
      UPDATE sector SET fallback_questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ADMINISTRATION')
      WHERE code = 'ADMINISTRATION';
      INSERT INTO question (questionnaire_id, code, type, position)
      SELECT id, 'GOAL_ACHIEVED', 'yes_partial_no', 1 FROM questionnaire WHERE code = 'ADMINISTRATION';
      INSERT INTO answer_option (question_id, code, value, position)
      SELECT id, 'YES', 1, 1 FROM question WHERE code = 'GOAL_ACHIEVED';
    `);
    // The feedback has no service: the sector comes from the establishment type.
    const questionnaireFeedback = "8e3f2051-4c6d-4e8f-9091-a2b3c4d5e6f7";
    await upsertFeedback(questionnaireFeedback, {
      channel: "search", establishmentId: ids.pa, language: "fr", visitPeriod: "today",
    });
    const selected = await getDetailedQuestionnaire(questionnaireFeedback);
    expect(selected.kind).toBe("sector");

    await saveAnswer(questionnaireFeedback, "GOAL_ACHIEVED", { option: "YES" });
    const [row] = await rows<{ used: number; expected: number }>(
      `SELECT f.detailed_questionnaire_id AS used, q.id AS expected
       FROM feedback f, questionnaire q WHERE f.id = $1 AND q.code = 'ADMINISTRATION'`,
      [questionnaireFeedback],
    );
    expect(row!.used).toBe(row!.expected);
  });

  it("replaces the checked topics", async () => {
    await saveTopics(feedbackId, { topics: [{ code: "WAIT_TIME" }, { code: "OTHER", otherText: "Parking" }] });
    await saveTopics(feedbackId, { topics: [{ code: "STAFF" }, { code: "OTHER", otherText: "Toilettes" }] });
    const topics = await rows(
      `SELECT t.code, ft.other_text FROM feedback_topic ft JOIN topic t ON t.id = ft.topic_id
       WHERE ft.feedback_id = $1 ORDER BY t.code`,
      [feedbackId],
    );
    expect(topics).toEqual([
      { code: "OTHER", other_text: "Toilettes" },
      { code: "STAFF", other_text: null },
    ]);
    await expect(saveTopics(feedbackId, { topics: [{ code: "PARKING" }] }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("saves the comment and sends an edited comment back to moderation", async () => {
    await saveComment(feedbackId, { text: "Deux heures d'attente.", promptOption: "DISSATISFIED" });
    await db.query("UPDATE comment SET status = 'published' WHERE feedback_id = $1", [feedbackId]);
    await saveComment(feedbackId, { text: "Deux heures d'attente, guichet fermé.", promptOption: "DISSATISFIED" });
    const [row] = await rows("SELECT text, status FROM comment WHERE feedback_id = $1", [feedbackId]);
    expect(row).toEqual({ text: "Deux heures d'attente, guichet fermé.", status: "pending" });
    await expect(saveComment(feedbackId, { text: "Bien", promptOption: "YES" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("published stats", () => {
  it("adds up services and publishes a month only above the threshold", async () => {
    await db.exec(`
      INSERT INTO feedback (id, establishment_id, service_id, channel, language, visit_period, visit_month)
      SELECT gen_random_uuid(), '${ids.dantec}', NULL, 'qr', 'fr', 'today', '2026-02-01'
      FROM generate_series(1, 10);
      INSERT INTO answer (feedback_id, question_id, option_id)
      SELECT f.id, q.id, ao.id
      FROM feedback f, question q JOIN answer_option ao ON ao.question_id = q.id
      WHERE f.establishment_id = '${ids.dantec}' AND q.code = 'OVERALL_SATISFACTION' AND ao.code = 'VERY_SATISFIED';
      REFRESH MATERIALIZED VIEW monthly_stats;
    `);
    expect(await getEstablishmentStats(ids.dantec!)).toEqual([
      { month: "2026-02-01", feedbackCount: 10, avgSatisfaction: 5 },
    ]);
    // One feedback in March for Grand-Yoff: below the threshold.
    expect(await getEstablishmentStats(ids.gy!)).toEqual([]);
  });
});
