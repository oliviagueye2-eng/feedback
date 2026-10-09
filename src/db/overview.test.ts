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

  // Electricity and water without a service: the agency's blocks since 0048.
  expect(o.alerts.fewTopics.map((p) => `${p.sector}|${p.service}`)).not.toContain("ELECTRICITY|null");
  expect(o.paths.find((p) => p.sector === "WATER" && p.service === null)!.topics).toHaveLength(7);
  // The port's procedures: « Frais » from the FEES block, given by TRANSPORT and FILE_SERVICES alike (0046), once.
  expect(o.alerts.duplicates.filter((d) => d.path.service === "PORT_PROCEDURE")).toEqual([]);
  const port = o.paths.find((p) => p.service === "PORT_PROCEDURE")!;
  expect(port.topics.find((t) => t.code === "FEES")!.lists).toEqual([{ code: "FEES", level: "sector" }]);
  // « Politesse du personnel » is offered nowhere since 0038.
  expect(o.alerts.unusedTopics.map((t) => t.code)).toContain("STAFF");
  expect(o.alerts.emptyLists.map((l) => `${l.kind}:${l.code}`)).toEqual(
    expect.arrayContaining(["topics:COMMON"]),
  );
  // COMMON and ESSENTIAL are used by every feedback, through their code.
  expect(o.alerts.unusedLists.map((l) => l.code)).not.toContain("COMMON");
  expect(o.alerts.unusedLists.map((l) => l.code)).not.toContain("ESSENTIAL");
  // A list says who uses it.
  const roadTrip = o.lists.find((l) => l.kind === "topics" && l.code === "ROAD_TRIP")!;
  expect(roadTrip.services).toEqual(["APP_RIDE", "LAND_TRIP", "STREET_TAXI_RIDE"]);
  expect(roadTrip.items).toEqual(["DRIVER_BEHAVIOUR", "PUNCTUALITY", "ROUTE", "DRIVING_SAFETY"]);
  // Lists combined, not copied (0044, 0045): the VTC ride gets ROAD_TRIP, then its own « Prise en charge »,
  // and pays as it wishes through PAYMENT, like the taxi and the ticket counters.
  const vtc = o.paths.find((p) => p.service === "APP_RIDE")!;
  expect(vtc.topics.map((t) => t.code)).toEqual(expect.arrayContaining(["DRIVER_BEHAVIOUR", "ROUTE", "DRIVING_SAFETY", "PICKUP"]));
  expect(vtc.topics.find((t) => t.code === "PICKUP")!.lists.map((l) => l.code)).toEqual(["APP_RIDE"]);
  expect(vtc.questions.find((q) => q.code === "PAYMENT_AS_WISHED")!.lists.map((l) => l.code)).toEqual(["PAYMENT"]);
  const payment = o.lists.find((l) => l.kind === "questions" && l.code === "PAYMENT")!;
  expect(payment.services).toEqual(["APP_RIDE", "PLANE_TICKET", "STREET_TAXI_RIDE", "TICKET_PURCHASE"]);
  // « Frais payés » straight away where one always pays (0047), after « Avez-vous payé quelque chose ? » elsewhere.
  expect(vtc.topics.find((t) => t.code === "FEES")).toMatchObject({
    label: "Frais payés (montant justifié et conforme au tarif annoncé, reçu remis)",
    gated: false,
  });
  expect(port.topics.find((t) => t.code === "FEES")!.gated).toBe(true);
  expect(o.paths.filter((p) => p.topics.some((t) => t.code === "FEES" && !t.gated)).map((p) => p.service).sort()).toEqual([
    "APP_RIDE", "BOAT_CROSSING", "FLIGHT", "HIGHWAY_TRIP", "LAND_TRIP", "PLANE_TICKET", "STREET_TAXI_RIDE",
    "TICKET_PURCHASE", "TRAIN_TRIP",
  ]);
  // The airport: the stations' questions, then its own.
  const airport = o.paths.find((p) => p.type === "AIRPORT")!;
  expect(airport.questions.map((q) => q.code)).toEqual(["CHECKS_WAIT", "WAYFINDING", "SEAT_TO_WAIT", "TOILETS", "TRANSPORT_ACCESS"]);
});
