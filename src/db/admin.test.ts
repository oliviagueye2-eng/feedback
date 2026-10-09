/**
 * The back-office (0028) against an in-memory PostgreSQL with the real
 * migrations: sign-in blocking, comments, establishments added by users,
 * the dashboard, and the published results once a contact is deleted.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  correctComment,
  correctEstablishment,
  getCategoriesAndTopics,
  getDashboard,
  getQuestionnaire,
  isValidSessionToken,
  listComments,
  listPendingEstablishments,
  LOGIN_MAX_FAILURES,
  markCommentReviewed,
  mergeEstablishment,
  refuseEstablishment,
  signIn,
  validateEstablishment,
} from "../domain/admin";
import { createSessionToken, isRightPassword } from "../domain/admin/session";
import { countCommentsByEstablishmentThisMonth } from "./admin";
import { createUserEstablishment } from "../domain/establishment";
import { recordPageShown, saveAnswer, saveComment, submitFeedback, upsertFeedback } from "../domain/feedback";
import { refreshPublishedStats } from "../domain/stats";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;
let active: string;

const rows = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

/** A feedback on `establishmentId`, its essential answer given. */
async function startFeedback(id: string, establishmentId: string, satisfaction: string) {
  await upsertFeedback(id, { channel: "search", establishmentId, language: "fr", visitPeriod: "today" });
  await saveAnswer(id, "OVERALL_SATISFACTION", { option: satisfaction });
}

/** Started more than a day ago, so it counts as not sent if it was never sent. */
const ageFeedback = (id: string) =>
  db.query(`UPDATE feedback SET started_at = date_trunc('hour', now()) - interval '30 hours' WHERE id = $1`, [id]);

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
  const [row] = await rows<{ id: string }>(
    `INSERT INTO establishment (name, type_id)
     VALUES ('Centre de santé de Test', (SELECT id FROM establishment_type WHERE code = 'HEALTH_CENTER'))
     RETURNING id`,
  );
  active = row!.id;
});

afterAll(async () => {
  useTestDatabase(null);
  await db.close();
});

describe("session", () => {
  it("accepts the right password only", () => {
    expect(isRightPassword("secret", "secret")).toBe(true);
    expect(isRightPassword("Secret", "secret")).toBe(false);
    expect(isRightPassword("", "")).toBe(false);
  });

  it("signs the cookie with the password, for 7 days", () => {
    const now = Date.UTC(2026, 9, 7);
    const token = createSessionToken("secret", now);
    expect(isValidSessionToken(token, "secret", now + 1000)).toBe(true);
    expect(isValidSessionToken(token, "other", now + 1000)).toBe(false);
    expect(isValidSessionToken(token, "secret", now + 8 * 24 * 3600 * 1000)).toBe(false);
    expect(isValidSessionToken(`${now + 1e9}.forged`, "secret", now)).toBe(false);
    expect(isValidSessionToken(undefined, "secret", now)).toBe(false);
  });
});

describe("sign-in", () => {
  it("blocks an address after 5 failures, even with the right password", async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      expect(await signIn("1.2.3.4", "wrong", "secret")).toEqual({ ok: false, reason: "wrong" });
    }
    expect(await signIn("1.2.3.4", "secret", "secret")).toEqual({ ok: false, reason: "blocked" });
    // Another address is not blocked; a success starts its count again.
    expect((await signIn("5.6.7.8", "secret", "secret")).ok).toBe(true);
  });

  it("forgets the attempts after a day (nightly job)", async () => {
    await db.query(`UPDATE admin_login_attempt SET attempted_at = now() - interval '25 hours'`);
    await refreshPublishedStats();
    expect(await rows(`SELECT * FROM admin_login_attempt`)).toEqual([]);
    expect((await signIn("1.2.3.4", "secret", "secret")).ok).toBe(true);
  });
});

describe("comments", () => {
  const id = "a1a1a1a1-0028-4000-8000-000000000001";

  it("lists the comment to read, then the corrected one as read", async () => {
    await startFeedback(id, active, "DISSATISFIED");
    await saveComment(id, { text: "Appelez-moi au 77 123 45 67.", promptOption: "DISSATISFIED" });
    const [pending] = await listComments("pending", false);
    expect(pending).toMatchObject({
      feedbackId: id,
      text: "Appelez-moi au 77 123 45 67.",
      establishmentName: "Centre de santé de Test",
      sent: false,
    });
    await correctComment(id, "Appelez-moi au [numéro retiré].");
    expect(await listComments("pending", false)).toEqual([]);
    const [reviewed] = await listComments("reviewed", false);
    expect(reviewed?.text).toBe("Appelez-moi au [numéro retiré].");
  });

  it("goes back to reading when the user changes it", async () => {
    await saveComment(id, { text: "Autre texte.", promptOption: "DISSATISFIED" });
    expect((await listComments("pending", false)).map((c) => c.feedbackId)).toEqual([id]);
    await markCommentReviewed(id);
    expect(await listComments("pending", false)).toEqual([]);
  });

  it("counts this month's comments by establishment, and filters on one", async () => {
    expect(await countCommentsByEstablishmentThisMonth()).toEqual([
      { establishmentId: active, name: "Centre de santé de Test", municipality: null, total: 1, pending: 0 },
    ]);
    expect(await listComments("reviewed", false, active)).toHaveLength(1);
    expect(await listComments("reviewed", false, "a1a1a1a1-0028-4000-8000-0000000000ff")).toEqual([]);
    expect(await listComments("reviewed", false, "pas-un-uuid")).toHaveLength(1);
  });

  it("refuses an empty correction", async () => {
    await expect(correctComment(id, "  ")).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("establishments added by users", () => {
  const added = async (name: string) =>
    (await createUserEstablishment({ name, sector: "HEALTH", type: "OTHER", municipality: "Thiès" })).id;

  it("corrects the name, sector and type, then validates", async () => {
    const id = await added("centre sante tiess");
    await correctEstablishment(id, {
      name: "Centre de santé de Thiès",
      municipality: "Thiès",
      sectorCode: "HEALTH",
      typeCode: "HEALTH_CENTER",
    });
    const pending = (await listPendingEstablishments()).find((e) => e.id === id);
    expect(pending).toMatchObject({ name: "Centre de santé de Thiès", typeCode: "HEALTH_CENTER", sectorCode: "HEALTH" });
    await validateEstablishment(id);
    expect((await listPendingEstablishments()).some((e) => e.id === id)).toBe(false);
    expect(await rows(`SELECT status FROM establishment WHERE id = $1`, [id])).toEqual([{ status: "active" }]);
  });

  it("refuses a type of another sector", async () => {
    const id = await added("mairie inconnue");
    await expect(
      correctEstablishment(id, { name: "Mairie", municipality: "", sectorCode: "HEALTH", typeCode: "TOWN_HALL" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("merges: the feedbacks move to the establishment chosen", async () => {
    const id = await added("hopital test bis");
    const feedback = "a1a1a1a1-0028-4000-8000-000000000002";
    await startFeedback(feedback, id, "SATISFIED");
    await mergeEstablishment(id, active);
    expect(await rows(`SELECT establishment_id FROM feedback WHERE id = $1`, [feedback])).toEqual([
      { establishment_id: active },
    ]);
    expect(await rows(`SELECT status, merged_into_id FROM establishment WHERE id = $1`, [id])).toEqual([
      { status: "merged", merged_into_id: active },
    ]);
  });

  it("refuses: its sent feedbacks no longer count in the results", async () => {
    const id = await added("faux etablissement");
    const feedback = "a1a1a1a1-0028-4000-8000-000000000003";
    await startFeedback(feedback, id, "SATISFIED");
    await submitFeedback(feedback, { contact: "77 000 00 01", attested: true });
    const published = () => rows(`SELECT id FROM published_feedback WHERE id = $1`, [feedback]);
    expect(await published()).toHaveLength(1);
    await refuseEstablishment(id);
    expect(await published()).toEqual([]);
  });
});

describe("published results", () => {
  it("keep a feedback once its contact is deleted after 12 months", async () => {
    const id = "a1a1a1a1-0028-4000-8000-000000000004";
    await startFeedback(id, active, "SATISFIED");
    await submitFeedback(id, { contact: "a@example.sn", attested: true });
    await db.query(`UPDATE feedback_contact SET attested_at = date_trunc('hour', now()) - interval '13 months' WHERE feedback_id = $1`, [id]);
    await refreshPublishedStats();
    expect(await rows(`SELECT 1 FROM feedback_contact WHERE feedback_id = $1`, [id])).toEqual([]);
    expect(await rows(`SELECT id FROM published_feedback WHERE id = $1`, [id])).toHaveLength(1);
  });
});

describe("dashboard", () => {
  it("counts this month's feedbacks and where the ones not sent stopped", async () => {
    await db.exec(`DELETE FROM comment; DELETE FROM feedback_contact; DELETE FROM answer; DELETE FROM feedback`);
    const sent = "b2b2b2b2-0028-4000-8000-000000000001";
    await startFeedback(sent, active, "VERY_SATISFIED");
    await recordPageShown(sent, "send");
    await submitFeedback(sent, { contact: "77 000 00 02", attested: true });

    const stops: [string, string, "details" | "sector" | "common" | "send"][] = [
      ["b2b2b2b2-0028-4000-8000-000000000002", "SATISFIED", "details"],
      ["b2b2b2b2-0028-4000-8000-000000000003", "DISSATISFIED", "common"],
      ["b2b2b2b2-0028-4000-8000-000000000004", "DISSATISFIED", "send"],
    ];
    for (const [id, satisfaction, page] of stops) {
      await startFeedback(id, active, satisfaction);
      await recordPageShown(id, page);
      await ageFeedback(id);
    }
    // Started less than 24 hours ago: still in progress, not counted.
    await startFeedback("b2b2b2b2-0028-4000-8000-000000000005", active, "DISSATISFIED");

    const d = await getDashboard();
    expect(d.month).toMatchObject({ complete: 1, notSent: 3, abandonPercent: 75, satisfiedComplete: 100, satisfiedNotSent: 33 });
    expect(d.stops.map((s) => [s.page, s.satisfied, s.notSatisfied, s.percent])).toEqual([
      ["details", 1, 0, 25],
      ["sector", 0, 0, 0],
      ["common", 0, 1, 25],
      ["send", 0, 1, 25],
    ]);
    expect(d.weeks).toHaveLength(8);
    expect(d.weeks.at(-1)?.count).toBe(1);
  });

  it("does not move the page once the feedback is sent", async () => {
    const sent = "b2b2b2b2-0028-4000-8000-000000000001";
    await recordPageShown(sent, "details");
    expect(await rows(`SELECT last_page FROM feedback WHERE id = $1`, [sent])).toEqual([{ last_page: "send" }]);
  });
});

describe("questionnaire", () => {
  it("lists every sector, type and service with its topic list", async () => {
    const q = await getQuestionnaire({});
    expect(q.sector).toBeNull();
    const health = q.sectors.find((s) => s.code === "HEALTH")!;
    expect(health).toMatchObject({ label: "Santé", listCodes: ["HEALTH", "STAFF_SKILLS", "COUNTER", "PREMISES", "FEES"] });
    expect(health.topics).toContainEqual({ code: "CARE_RECEIVED", label: "Soins reçus", isActive: true, categoryCode: "OUTCOME", shownIf: null });
    const airport = q.types.find((t) => t.code === "AIRPORT")!;
    expect(airport).toMatchObject({ sectorCode: "TRANSPORT", listCodes: ["STAFF_SKILLS", "COUNTER"] });
    expect(airport.topics.map((t) => t.code)).toEqual(["PROFESSIONALISM", "INFORMATION", "WAIT_TIME", "OPENING_HOURS"]);
    expect(q.types.find((t) => t.code === "PHARMACY")).toMatchObject({ listCodes: [], topics: [] });
    expect(q.services.find((s) => s.code === "MOBILE_MONEY")).toMatchObject({ replacesSharedLists: true });
    expect(q.sectorOptions.length).toBe(q.sectors.length);
  });

  it("narrows to a type, its sector and the services of its establishments", async () => {
    const q = await getQuestionnaire({ sector: "HEALTH", type: "HIGH_SCHOOL" });
    expect(q).toMatchObject({ sector: "EDUCATION", type: "HIGH_SCHOOL" });
    expect(q.sectors.map((s) => s.code)).toEqual(["EDUCATION"]);
    expect(q.types.map((t) => t.code)).toEqual(["HIGH_SCHOOL"]);
    expect(q.types[0]!.services).toEqual(["SCHOOL_ADMIN", "SCHOOL_LIFE"]);
    expect(q.services.map((s) => s.code)).toEqual(["SCHOOL_ADMIN", "SCHOOL_LIFE"]);
    expect(q.services[0]!.establishments).toContain("Lycée Lamine Guèye");
  });

  it("narrows to a sector, and ignores an unknown code", async () => {
    const q = await getQuestionnaire({ sector: "EDUCATION" });
    expect(q.types.every((t) => t.sectorCode === "EDUCATION")).toBe(true);
    expect(q.services.every((s) => s.sectorCodes.includes("EDUCATION"))).toBe(true);
    const all = await getQuestionnaire({ sector: "NOPE", type: "NOPE" });
    expect(all).toMatchObject({ sector: null, type: null });
    expect(all.sectors.length).toBeGreaterThan(1);
  });

  it("narrows to a service, the sectors and types offering it", async () => {
    const q = await getQuestionnaire({ type: "AIRPORT", service: "SCHOOL_LIFE" });
    expect(q).toMatchObject({ sector: null, type: null, service: "SCHOOL_LIFE" });
    expect(q.services.map((s) => s.code)).toEqual(["SCHOOL_LIFE"]);
    expect(q.sectors.map((s) => s.code)).toEqual(["EDUCATION"]);
    expect(q.types.map((t) => t.code)).toContain("HIGH_SCHOOL");
    expect(q.types.every((t) => q.services[0]!.typeCodes.includes(t.code))).toBe(true);
    expect(q.questions.length).toBeLessThan((await getQuestionnaire({})).questions.length);
    const both = await getQuestionnaire({ type: "HIGH_SCHOOL", service: "SCHOOL_LIFE" });
    expect(both).toMatchObject({ sector: "EDUCATION", type: "HIGH_SCHOOL" });
    expect(both.types.map((t) => t.code)).toEqual(["HIGH_SCHOOL"]);
  });

  it("puts mobile money in its own sector, apart from banks and insurers", async () => {
    const banking = await getQuestionnaire({ sector: "BANKING_INSURANCE" });
    expect(banking.services.map((s) => s.code)).toEqual(["INSURANCE_CLAIM"]);
    const mobile = await getQuestionnaire({ sector: "MOBILE_PAYMENT" });
    // 0031: lists of its own, for a feedback with no service (« Autre démarche »).
    expect(mobile.sectors).toEqual([
      {
        code: "MOBILE_PAYMENT",
        label: "Paiement mobile",
        listCodes: ["MOBILE_PAYMENT", "STAFF_SKILLS", "FEES"],
        // In the order of the categories, then of topic.position.
        topics: [
          ["REQUEST_HANDLING", "OUTCOME"],
          ["PROFESSIONALISM", "STAFF"],
          ["INFORMATION", "STAFF"],
          ["WAIT_TIME", "DELAYS"],
          ["FEES", "COST"],
          ["ACCOUNT_SECURITY", "SERVICE_QUALITY"],
        ].map(([code, categoryCode]) => ({
          code,
          label: expect.any(String),
          isActive: true,
          categoryCode,
          // 0011: « Frais » only after « Oui » to « Avez-vous payé quelque chose ? ».
          shownIf: code === "FEES" ? { dependsOn: "PAID_SOMETHING", options: ["YES"] } : null,
        })),
        questionListCodes: ["MOBILE_PAYMENT"],
        questions: [{ code: "GOAL_ACHIEVED", position: 1, categoryCode: "OUTCOME", conditions: [] }],
      },
    ]);
    expect(mobile.services.map((s) => s.code)).toEqual(["MOBILE_MONEY", "MOBILE_MONEY_AGENT", "MOBILE_MONEY_SUPPORT"]);
    expect(mobile.services[0]!.establishments).toEqual(["Mixx by Yas", "Orange Money", "Wave"]);
  });

  it("lists the question bank, narrowed by the filters to the lists shown", async () => {
    const all = await getQuestionnaire({});
    expect(all.questions).toHaveLength(79);
    const receipt = all.questions.find((q) => q.code === "RECEIPT_GIVEN")!;
    expect(all.questions.find((q) => q.code === "PAID_SOMETHING")!.opensTopics).toEqual(["FEES"]);
    // FILE_SUBMITTED is in no list, but opens two topics of the civil registry centres.
    const civil = await getQuestionnaire({ sector: "ADMINISTRATION" });
    expect(civil.questions.map((q) => q.code)).toContain("FILE_SUBMITTED");
    expect(receipt).toMatchObject({ type: "single_choice", categoryCode: "COST" });
    // One list since 0045, combined with the sector's.
    expect(receipt.lists).toEqual(["PAID_AND_RECEIPT"]);
    expect(receipt.conditions).toEqual([{ listCode: "PAID_AND_RECEIPT", dependsOn: "PAID_SOMETHING", options: ["YES"] }]);
    // A question asked elsewhere than screen 6 is in no list, and still in the bank.
    expect(all.questions.find((q) => q.code === "FILE_SUBMITTED")!.lists).toEqual([]);

    const mobile = await getQuestionnaire({ sector: "MOBILE_PAYMENT" });
    expect(mobile.questions.map((q) => q.code)).toEqual([
      // By category, then by code.
      "GOAL_ACHIEVED", "MONEY_OPERATION_OK", "MONEY_PROBLEM_SOLVED", "AGENT_CASH", "OVERALL_SATISFACTION",
      // Opens FEES, a topic of the Paiement mobile list, at screen 2b.
      "PAID_SOMETHING",
      "REPORTED", "REPORT_WHY",
    ]);
  });

  it("lists the categories with their topics and questions", async () => {
    const { categories } = await getCategoriesAndTopics();
    expect(categories.map((c) => c.code)).toEqual([
      "OUTCOME", "STAFF", "DELAYS", "PROCEDURE", "COST", "SERVICE_QUALITY", "PREMISES",
    ]);
    const delays = categories.find((c) => c.code === "DELAYS")!;
    expect(delays).toMatchObject({ label: "Délais", position: 3 });
    expect(delays.topics[0]).toEqual({ code: "WAIT_TIME", label: "Temps d'attente", isActive: true, categoryCode: "DELAYS", shownIf: null });
    expect(delays.questions).toContain("WAIT_TIME");
  });

  it("lists every topic with its category, condition and lists", async () => {
    const { topics } = await getCategoriesAndTopics();
    expect(topics.map((t) => t.categoryCode).slice(0, 1)).toEqual(["OUTCOME"]);
    const fees = topics.find((t) => t.code === "FEES")!;
    expect(fees).toMatchObject({ isActive: true, shownIf: { dependsOn: "PAID_SOMETHING", options: ["YES"] } });
    expect(fees.lists).toContain("COMMERCE");
    expect(topics.find((t) => t.code === "WAIT_TIME")).toMatchObject({ label: expect.any(String), categoryCode: "DELAYS" });
  });

  it("lists a level's questions in the order of screen 6", async () => {
    const q = await getQuestionnaire({ sector: "ADMINISTRATION" });
    // « Avez-vous payé… ? » stays right before the receipt it opens.
    expect(q.sectors[0]!.questions.map((x) => x.code)).toEqual([
      "GOAL_ACHIEVED", "WAIT_TIME", "VISITS_COUNT", "DOCUMENTS_KNOWN", "PAID_SOMETHING", "RECEIPT_GIVEN",
    ]);
    // With its condition in this list.
    expect(q.sectors[0]!.questions.at(-1)!.conditions).toEqual([{ dependsOn: "PAID_SOMETHING", options: ["YES"] }]);
  });

  it("shows an inactive topic as such", async () => {
    await db.query(`UPDATE topic SET is_active = false WHERE code = 'CARE_RECEIVED'`);
    try {
      const q = await getQuestionnaire({ sector: "HEALTH" });
      expect(q.sectors[0]!.topics).toContainEqual({ code: "CARE_RECEIVED", label: "Soins reçus", isActive: false, categoryCode: "OUTCOME", shownIf: null });
    } finally {
      await db.query(`UPDATE topic SET is_active = true WHERE code = 'CARE_RECEIVED'`);
    }
  });
});
