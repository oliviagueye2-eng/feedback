/**
 * The sector whose lists a feedback gets is the establishment's, never the
 * service's (decided by Olivia, 2026-10-08): nothing stops establishment_service
 * from linking a place to a service of another sector.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { upsertFeedback } from "../domain/feedback";
import { useTestDatabase } from "./client";
import { findQuestionSetSources, findTopicChoices } from "./feedbacks";
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

it("takes the establishment's sector when its service belongs to another sector", async () => {
  const [{ id: establishmentId }] = (
    await db.query<{ id: string }>(
      `INSERT INTO establishment (name, type_id)
       VALUES ('Centre de santé de Test', (SELECT id FROM establishment_type WHERE code = 'HEALTH_CENTER'))
       RETURNING id`,
    )
  ).rows as [{ id: string }];
  const [{ id: serviceId }] = (
    await db.query<{ id: number }>(`SELECT id FROM service WHERE code = 'SCHOOL_LIFE'`)
  ).rows as [{ id: number }];
  await db.query(`INSERT INTO establishment_service (establishment_id, service_id) VALUES ($1, $2)`, [
    establishmentId,
    serviceId,
  ]);
  const feedbackId = "c3c3c3c3-0029-4000-8000-000000000001";
  await upsertFeedback(feedbackId, { channel: "search", establishmentId, serviceId, language: "fr", visitPeriod: "today" });

  const [{ id: health }] = (
    await db.query<{ id: number }>(`SELECT id FROM question_set WHERE code = 'HEALTH'`)
  ).rows as [{ id: number }];
  expect(await findQuestionSetSources(feedbackId)).toMatchObject({ sectorKnown: true, sectorSetId: health });

  const topics = (await findTopicChoices(feedbackId)).map((t) => t.code);
  expect(topics).toContain("CARE_RECEIVED"); // HEALTH, the establishment's sector
  expect(topics).toContain("TEACHING_QUALITY"); // the service's own list stays
});
