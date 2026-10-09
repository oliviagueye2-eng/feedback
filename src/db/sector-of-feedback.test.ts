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
      // No type: the health sector's care lists go to it (0070, only_without_type).
      `INSERT INTO establishment (name, sector_id)
       VALUES ('Centre de santé de Test', (SELECT id FROM sector WHERE code = 'HEALTH'))
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
  expect(await findQuestionSetSources(feedbackId)).toMatchObject({ sectorKnown: true, sectorSetIds: [health, expect.any(Number)] });

  const topics = (await findTopicChoices(feedbackId)).map((t) => t.code);
  expect(topics).toContain("CARE_RECEIVED"); // HEALTH, the establishment's sector
  expect(topics).toContain("TEACHING_QUALITY"); // the service's own list stays
});

it("gives a pharmacy its own form, without the care lists of a health place without a type (0070)", async () => {
  const [{ id: establishmentId }] = (
    await db.query<{ id: string }>(
      `INSERT INTO establishment (name, type_id)
       VALUES ('Pharmacie de Test', (SELECT id FROM establishment_type WHERE code = 'PHARMACY'))
       RETURNING id`,
    )
  ).rows as [{ id: string }];
  const feedbackId = "c3c3c3c3-0070-4000-8000-000000000001";
  await upsertFeedback(feedbackId, { channel: "search", establishmentId, language: "fr", visitPeriod: "today" });

  const topics = (await findTopicChoices(feedbackId)).map((t) => t.code);
  expect(topics).toContain("MEDICINES_IN_STOCK");
  expect(topics).toContain("WAIT_TIME"); // the sector's COUNTER, shared by the three forms
  expect(topics).not.toContain("CARE_RECEIVED");
  expect(topics).not.toContain("FEES");
});

it("gives « Autre démarche » the counter's blocks at a school, and only there (0072)", async () => {
  const insert = async (name: string, type: string) =>
    ((await db.query<{ id: string }>(
      `INSERT INTO establishment (name, type_id) VALUES ($1, (SELECT id FROM establishment_type WHERE code = $2)) RETURNING id`,
      [name, type],
    )).rows as [{ id: string }])[0].id;
  const school = await insert("Lycée de Test", "HIGH_SCHOOL");
  const [{ id: schoolLife }] = (
    await db.query<{ id: number }>(`SELECT id FROM service WHERE code = 'SCHOOL_LIFE'`)
  ).rows as [{ id: number }];
  await db.query(`INSERT INTO establishment_service (establishment_id, service_id) VALUES ($1, $2)`, [school, schoolLife]);
  const topicsOf = async (feedbackId: string, establishmentId: string, serviceId?: number) => {
    await upsertFeedback(feedbackId, { channel: "search", establishmentId, serviceId, language: "fr", visitPeriod: "today" });
    return (await findTopicChoices(feedbackId)).map((t) => t.code);
  };

  expect(await topicsOf("c3c3c3c3-0072-4000-8000-000000000001", school)).toContain("WAIT_TIME");
  expect(await topicsOf("c3c3c3c3-0072-4000-8000-000000000002", school, schoolLife)).not.toContain("WAIT_TIME");
  // The preschool has no paths: its own form, without the counter's blocks.
  const preschool = await insert("Case des tout-petits de Test", "PRESCHOOL");
  const topics = await topicsOf("c3c3c3c3-0072-4000-8000-000000000003", preschool);
  expect(topics).toContain("CHILD_ACTIVITIES");
  expect(topics).not.toContain("WAIT_TIME");
});
