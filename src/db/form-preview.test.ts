/**
 * The form shown in the back office (Questionnaire, asked by Olivia,
 * 2026-10-08) is the one a feedback with the same levels gets: same topics,
 * same lists of questions.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { getQuestionnaire } from "../domain/admin";
import { upsertFeedback } from "../domain/feedback";
import { useTestDatabase } from "./client";
import {
  findFormQuestionSetSources,
  findFormTopicChoices,
  findQuestionSetSources,
  findTopicChoices,
} from "./feedbacks";
import { createTestDatabase } from "./test-database";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
});

afterAll(async () => {
  useTestDatabase(null);
  await db.close();
});

it("gives every establishment and service the topics and lists of a real feedback", { timeout: 60_000 }, async () => {
  const rows = (
    await db.query<{ id: string; sector: string | null; type: string | null; service_id: number | null; service: string | null }>(
      `SELECT e.id, sec.code AS sector, et.code AS type, sv.id AS service_id, sv.code AS service
       FROM establishment e
       LEFT JOIN establishment_type et ON et.id = e.type_id
       LEFT JOIN sector sec ON sec.id = coalesce(et.sector_id, e.sector_id)
       LEFT JOIN establishment_service es ON es.establishment_id = e.id
       LEFT JOIN service sv ON sv.id = es.service_id
       WHERE e.status = 'active'
       UNION ALL
       SELECT e.id, sec.code, et.code, NULL, NULL
       FROM establishment e
       LEFT JOIN establishment_type et ON et.id = e.type_id
       LEFT JOIN sector sec ON sec.id = coalesce(et.sector_id, e.sector_id)
       WHERE e.status = 'active'`,
    )
  ).rows;
  expect(rows.length).toBeGreaterThan(50);
  let n = 0;
  for (const row of rows) {
    const feedbackId = `c3c3c3c3-0030-4000-8000-${String(++n).padStart(12, "0")}`;
    await upsertFeedback(feedbackId, {
      channel: "search",
      establishmentId: row.id,
      serviceId: row.service_id,
      language: "fr",
      visitPeriod: "today",
    });
    const levels = { sector: row.sector, type: row.type, service: row.service };
    expect(await findFormTopicChoices(levels)).toEqual(await findTopicChoices(feedbackId));
    expect(await findFormQuestionSetSources(levels)).toEqual(await findQuestionSetSources(feedbackId));
  }
});

it("shows the form of an establishment, with its sector and type", async () => {
  const [{ id }] = (
    await db.query<{ id: string }>(`SELECT id FROM establishment WHERE name = 'Mairie de Grand Yoff'`)
  ).rows as [{ id: string }];
  const q = await getQuestionnaire({ establishment: id, service: "CIVIL_REGISTRY" });
  expect(q.form?.levels).toEqual({ sector: q.sector, type: "TOWN_HALL", service: "CIVIL_REGISTRY" });
  // Asked at screen 2b (it opens « Frais payés »): not asked again at screen 6.
  expect(q.form?.topics.some((t) => t.gate?.code === "PAID_SOMETHING")).toBe(true);
  expect(q.form?.questions.map((x) => x.code)).not.toContain("PAID_SOMETHING");
  expect(q.form?.questions.find((x) => x.code === "RECEIPT_GIVEN")?.conditions).toEqual([
    { question: "Avez-vous payé quelque chose ?", answers: ["Oui"] },
  ]);
  expect(q.form?.commonQuestions.map((x) => x.code)).toEqual(["REPORTED", "REPORT_WHY"]);
});

it("shows no form until an establishment or a sector is chosen", async () => {
  expect((await getQuestionnaire({ service: "CIVIL_REGISTRY" })).form).toBeNull();
});
