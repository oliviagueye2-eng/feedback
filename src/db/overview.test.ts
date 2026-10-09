/**
 * The overview of the questionnaire (asked by Olivia, 2026-10-09): every path
 * of an active establishment with the form it gets, and what needs a look.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { getOverview, getQuestionnaire } from "../domain/admin";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
}, 30_000);

afterAll(async () => {
  useTestDatabase(null);
  await db.close();
});

it("gives each path the form of its establishments and flags what needs a look", { timeout: 60_000 }, async () => {
  const o = await getOverview();
  // One path per sector, type and service, each with its establishments.
  const keys = o.paths.map((p) => `${p.sector}|${p.type}|${p.service}`);
  expect(new Set(keys).size).toBe(keys.length);
  const civil = o.paths.find((p) => p.type === "TOWN_HALL" && p.service === "CIVIL_REGISTRY")!;
  expect(civil.establishments.map((e) => e.name)).toContain("Mairie de Grand Yoff");
  // The same form as the Questionnaire page for one of them, « Autre » aside.
  const q = await getQuestionnaire({ establishment: civil.establishments[0]!.id, service: "CIVIL_REGISTRY" });
  expect(civil.topics.map((t) => t.code)).toEqual(q.form!.topics.map((t) => t.code).filter((c) => c !== "OTHER"));
  expect(civil.questions.map((x) => x.code)).toEqual(q.form!.questions.map((x) => x.code));

  // Electricity and water without a service: no topic of their own (0034).
  expect(o.alerts.fewTopics.map((p) => `${p.sector}|${p.service}`)).toEqual(
    expect.arrayContaining(["ELECTRICITY|null", "WATER|null"]),
  );
  // The port's procedures get some topics from TRANSPORT and FILE_SERVICES.
  expect(o.alerts.duplicates.filter((d) => d.path.service === "PORT_PROCEDURE").map((d) => d.lists)).toContainEqual([
    "TRANSPORT",
    "FILE_SERVICES",
  ]);
  // « Politesse du personnel » is offered nowhere since 0038.
  expect(o.alerts.unusedTopics.map((t) => t.code)).toContain("STAFF");
  expect(o.alerts.emptyLists.map((l) => `${l.kind}:${l.code}`)).toEqual(
    expect.arrayContaining(["topics:ELECTRICITY", "topics:WATER", "topics:COMMON"]),
  );
  // COMMON and ESSENTIAL are used by every feedback, through their code.
  expect(o.alerts.unusedLists.map((l) => l.code)).not.toContain("COMMON");
  expect(o.alerts.unusedLists.map((l) => l.code)).not.toContain("ESSENTIAL");
  // A list says who uses it.
  const roadTrip = o.lists.find((l) => l.kind === "topics" && l.code === "ROAD_TRIP")!;
  expect(roadTrip.services).toEqual(["LAND_TRIP", "STREET_TAXI_RIDE"]);
  expect(roadTrip.items).toEqual(["DRIVER_BEHAVIOUR", "PUNCTUALITY", "ROUTE", "DRIVING_SAFETY"]);
});
