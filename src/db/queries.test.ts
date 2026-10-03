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
  listSectors,
  searchEstablishments,
} from "../domain/establishment";
import {
  completeFeedback,
  nextQuestionPage,
  findFeedbackToResume,
  getDetailedQuestionnaire,
  getDetailsScreen,
  getEssentialScreen,
  getQuestionnaireScreen,
  removeComment,
  saveAnswer,
  saveComment,
  saveQuestionnaire,
  saveTopics,
  upsertFeedback,
} from "../domain/feedback";
import { getPublishedResults, refreshPublishedStats } from "../domain/stats";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;
const ids: Record<string, string> = {};

/** Only the establishments created by this test (the migrations add real ones). */
const ours = (list: { id: string }[]) => list.map((e) => e.id).filter((id) => Object.values(ids).includes(id));

const rows = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
  await db.exec(`
    INSERT INTO region (code, name) VALUES ('DK', 'Dakar');
    INSERT INTO department (region_id, code, name) SELECT id, 'DK1', 'Dakar' FROM region WHERE code = 'DK';
    INSERT INTO municipality (department_id, code, name)
    SELECT d.id, v.code, v.name FROM department d, (VALUES
      ('GY', 'Grand-Yoff'), ('PA', 'Parcelles Assainies'), ('FN', 'Fann-Point E-Amitié')) AS v (code, name)
    WHERE d.code = 'DK1';

    -- Types CIVIL_REGISTRY_CENTER and HOSPITAL come from migration 0005.
    INSERT INTO service (code, sector_id, synonyms)
    SELECT 'CIVIL_REGISTRY_BIRTH', id, '{extrait de naissance}' FROM sector WHERE code = 'ADMINISTRATION';
    INSERT INTO service_translation (service_id, language, label)
    SELECT id, 'fr', 'État civil' FROM service WHERE code = 'CIVIL_REGISTRY_BIRTH';
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
    WHERE e.type_id = (SELECT id FROM establishment_type WHERE code = 'CIVIL_REGISTRY_CENTER')
      AND s.code = 'CIVIL_REGISTRY_BIRTH';
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
      scope: "site",
      organizationCode: null,
      organizationName: null,
    });
  });

  it("recognises a service and lists the establishments offering it, never a closed one", async () => {
    const result = await searchEstablishments("extrait de naissance");
    expect(result.matchType).toBe("service");
    expect(ours(result.results).sort()).toEqual([ids.gy, ids.pa].sort());
  });

  it("shows only the establishments of the municipality named in the query", async () => {
    const result = await searchEstablishments("État civil Parcelles Assainies");
    expect(result.matchType).toBe("service");
    expect(ours(result.results)).toEqual([ids.pa]);
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
    expect(result.suggestions.map((e) => e.id)).toContain(ids.dantec);
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

  it("needs a name of 3 letters at least (UBA fits)", async () => {
    await expect(createUserEstablishment({ name: "UB" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(createUserEstablishment({ name: "UBA" })).resolves.toHaveProperty("id");
  });

  it("lists the nineteen sectors in alphabetical order, accents ignored", async () => {
    const sectors = await listSectors();
    expect(sectors).toHaveLength(19);
    expect(sectors.slice(0, 3).map((s) => s.label)).toEqual([
      "Administration et état civil",
      "Banques et assurances",
      "Commerce",
    ]);
    // "Eau" < "Éducation" < "Électricité": the accent does not push them to the end.
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

  it("finds the feedback to resume with « Précédent », only for its establishment", async () => {
    expect(await findFeedbackToResume(feedbackId, ids.gy)).toEqual({
      id: feedbackId,
      serviceId: null,
      visitPeriod: "under_week",
    });
    expect(await findFeedbackToResume(feedbackId, ids.dantec)).toBeNull();
    expect(await findFeedbackToResume("pas-un-uuid", ids.gy)).toBeNull();
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

  it("gives screen 2 the context and the essential question, in order", async () => {
    const { context, question } = await getEssentialScreen(feedbackId);
    expect(context).toEqual({
      establishmentId: ids.gy,
      establishmentName: "Centre d'état civil de Grand-Yoff",
      channel: "search",
      qrCode: null,
      serviceId: null,
      visitPeriod: "under_week",
      scope: "site",
      serviceLabel: null,
      essentialOption: "DISSATISFIED",
      completed: false,
    });
    expect(question.label).toBe("Êtes-vous satisfait(e) du service reçu ?");
    expect(question.options.map((o) => o.code)).toEqual([
      "VERY_SATISFIED", "SATISFIED", "NEUTRAL", "DISSATISFIED", "VERY_DISSATISFIED",
    ]);
    expect(question.options[3]).toMatchObject({ label: "Peu satisfait(e)", followUpPrompt: "Que s'est-il passé ?" });
    await expect(getEssentialScreen("9f4e3162-5d7e-4f90-a1b2-c3d4e5f60718")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an unknown option, an unknown question and an unknown feedback", async () => {
    await expect(saveAnswer(feedbackId, "OVERALL_SATISFACTION", { option: "YES" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(saveAnswer(feedbackId, "NOT_A_QUESTION", { option: "YES" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(saveAnswer("7d2e1f40-3b5c-4d7e-8f80-91a2b3c4d5e6", "OVERALL_SATISFACTION", { option: "SATISFIED" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("asks the list of the sector (« Services à dossier » for an administration)", async () => {
    // The feedback has no service: the sector comes from the establishment type.
    const fileFeedback = "8e3f2051-4c6d-4e8f-9091-a2b3c4d5e6f7";
    await upsertFeedback(fileFeedback, {
      channel: "search", establishmentId: ids.pa, language: "fr", visitPeriod: "today",
    });
    const { questions } = await getDetailedQuestionnaire(fileFeedback);
    expect(questions.map((q) => q.code)).toEqual([
      "GOAL_ACHIEVED", "VISITS_COUNT", "WAIT_TIME", "DOCUMENTS_KNOWN", "RECEIPT_GIVEN", "REPORTED", "REPORT_WHY",
    ]);
    await saveAnswer(fileFeedback, "GOAL_ACHIEVED", { option: "YES" });
    // A question of another list (the bus stop) cannot be answered here.
    await expect(saveAnswer(fileFeedback, "STOP_WAIT", { option: "UNDER_10_MIN" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await nextQuestionPage(fileFeedback, "details")).toBe("sector");
  });

  it("completes a feedback only once the essential question is answered, at the hour", async () => {
    const unanswered = "9f4a3162-5d7e-4f9a-8b1c-b3c4d5e6f7a8";
    await upsertFeedback(unanswered, {
      channel: "search", establishmentId: ids.dantec, language: "fr", visitPeriod: "today",
    });
    // Health has its five questions.
    expect((await getQuestionnaireScreen(unanswered, "sector")).questions).toHaveLength(5);
    await expect(completeFeedback(unanswered)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getEssentialScreen(unanswered)).context.completed).toBe(false);

    await completeFeedback(feedbackId);
    await completeFeedback(feedbackId);
    const [row] = await rows<{ step: string; on_the_hour: boolean }>(
      "SELECT step, completed_at = date_trunc('hour', completed_at) AS on_the_hour FROM feedback WHERE id = $1",
      [feedbackId],
    );
    expect(row).toEqual({ step: "completed", on_the_hour: true });
    expect((await getEssentialScreen(feedbackId)).context.completed).toBe(true);
    // A complete feedback is never resumed: screen 1 starts a new one.
    expect(await findFeedbackToResume(feedbackId, ids.gy)).toBeNull();
  });

  it("shows the health questions, saves the answers given and completes the feedback", async () => {
    const health = "b2c3d4e5-0000-4000-8000-000000000001";
    await upsertFeedback(health, { channel: "search", establishmentId: ids.dantec, language: "fr", visitPeriod: "today" });
    await saveAnswer(health, "OVERALL_SATISFACTION", { option: "NEUTRAL" });
    const before = await getQuestionnaireScreen(health, "sector");
    expect(before.questions.map((q) => q.code)).toEqual([
      "PATIENT", "CARE_RECEIVED", "WAIT_TIME", "PRESCRIPTION_AVAILABLE", "RECEIPT_GIVEN",
    ]);
    expect(before.questions[2]!.options.map((o) => o.label)[0]).toBe("Moins de 30 minutes");

    // Two answered, three skipped.
    // Satisfied enough: no common page after the sector's, the feedback ends.
    expect(await saveQuestionnaire(health, "sector", { WAIT_TIME: "2_TO_4_H", RECEIPT_GIVEN: "NO" })).toBeNull();
    const after = await getQuestionnaireScreen(health, "sector");
    expect(after.questions.map((q) => q.chosen)).toEqual([null, null, "2_TO_4_H", null, "NO"]);
    expect(after.context.completed).toBe(true);

    await expect(saveQuestionnaire(health, "sector", { WAIT_TIME: "NEVER" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("adds the common questions for a user not satisfied, and drops the answers that no longer apply", async () => {
    const unhappy = "b2c3d4e5-0000-4000-8000-000000000002";
    await upsertFeedback(unhappy, { channel: "search", establishmentId: ids.dantec, language: "fr", visitPeriod: "today" });
    await saveAnswer(unhappy, "OVERALL_SATISFACTION", { option: "VERY_DISSATISFIED" });
    expect(await nextQuestionPage(unhappy, "details")).toBe("sector");
    expect(await nextQuestionPage(unhappy, "sector")).toBe("common");
    expect((await getQuestionnaireScreen(unhappy, "sector")).questions).toHaveLength(5);
    // The common questions on their own page, « Précédent » back to the sector's.
    const common = await getQuestionnaireScreen(unhappy, "common");
    expect(common.previous).toBe("sector");
    expect(common.questions.map((q) => [q.code, q.revealedBy])).toEqual([
      ["REPORTED", null],
      ["REPORT_WHY", { dependsOn: "REPORTED", options: ["NO"] }],
    ]);

    await saveAnswer(unhappy, "REPORTED", { option: "NO" });

    // « Pourquoi ? » answered, then « Non » changed to « Oui » on the same page.
    expect(await saveQuestionnaire(unhappy, "sector", { WAIT_TIME: "OVER_4_H" })).toBe("common");
    expect(await saveQuestionnaire(unhappy, "common", { REPORTED: "YES_ANSWERED", REPORT_WHY: "POINTLESS" })).toBeNull();
    const answered = async () => (await rows<{ code: string }>(
      `SELECT q.code FROM answer a JOIN question q ON q.id = a.question_id
       WHERE a.feedback_id = $1 ORDER BY q.code`, [unhappy])).map((r) => r.code);
    expect(await answered()).toEqual(["OVERALL_SATISFACTION", "REPORTED", "WAIT_TIME"]);

    // Became satisfied: « Avez-vous signalé cette situation ? » no longer applies.
    await saveAnswer(unhappy, "OVERALL_SATISFACTION", { option: "SATISFIED" });
    expect(await nextQuestionPage(unhappy, "sector")).toBeNull();
    await completeFeedback(unhappy);
    expect(await answered()).toEqual(["OVERALL_SATISFACTION", "WAIT_TIME"]);
  });

  it("asks each transport service its questions, and nothing without a service", async () => {
    const establishment = async (name: string) =>
      (await rows<{ id: string }>("SELECT id FROM establishment WHERE name = $1", [name]))[0]!.id;
    const service = async (code: string) =>
      (await rows<{ id: number }>("SELECT id FROM service WHERE code = $1", [code]))[0]!.id;
    const firstQuestion = async (feedback: string, establishmentName: string, serviceCode: string | null) => {
      await upsertFeedback(feedback, {
        channel: "search", establishmentId: await establishment(establishmentName), language: "fr", visitPeriod: "today",
        serviceId: serviceCode ? await service(serviceCode) : null,
      });
      await saveAnswer(feedback, "OVERALL_SATISFACTION", { option: "SATISFIED" });
      return (await getQuestionnaireScreen(feedback, "sector")).questions[0]?.code;
    };
    expect(await firstQuestion("c3d4e5f6-0000-4000-8000-000000000001", "Dem Dikk", "LAND_TRIP")).toBe("STOP_WAIT");
    expect(await firstQuestion("c3d4e5f6-0000-4000-8000-000000000002", "Dem Dikk", "TICKET_PURCHASE")).toBe("GOAL_ACHIEVED");
    // No service chosen: the Transport sector has no list, so no question page.
    expect(await firstQuestion("c3d4e5f6-0000-4000-8000-000000000003", "Dem Dikk", null)).toBeUndefined();
    expect(await nextQuestionPage("c3d4e5f6-0000-4000-8000-000000000003", "details")).toBeNull();
    expect(await firstQuestion("c3d4e5f6-0000-4000-8000-000000000004", "Aline Sitoë Diatta (bateau Dakar – Ziguinchor)", null))
      .toBeUndefined();
    expect(await firstQuestion("c3d4e5f6-0000-4000-8000-000000000005", "COSAMA", "BOAT_CROSSING")).toBe("DEPARTURE_ON_TIME");
    // The airport gets the questions of its type (0005).
    const aibd = "c3d4e5f6-0000-4000-8000-000000000006";
    await firstQuestion(aibd, "Aéroport international Blaise Diagne", null);
    expect((await getQuestionnaireScreen(aibd, "sector")).questions.map((q) => q.code))
      .toEqual(["WAYFINDING", "CHECKS_WAIT", "SEAT_TO_WAIT", "TOILETS", "TRANSPORT_ACCESS"]);
    // Air Sénégal (0006): a flight; « Informé(e) ? » and « Pris(e) en charge ? » shown only after a delay.
    const flight = "c3d4e5f6-0000-4000-8000-000000000007";
    await firstQuestion(flight, "Air Sénégal", "FLIGHT");
    expect((await getQuestionnaireScreen(flight, "sector")).questions.map((q) => q.code))
      .toEqual(["DEPARTURE_ON_TIME", "DELAY_INFORMED", "DELAY_CARE", "BOARDING", "LUGGAGE"]);
    expect((await getQuestionnaireScreen(flight, "sector")).questions[0]?.label).toBe("Êtes-vous parti(e) à l'heure prévue ?");
    // Screen 1 offers the operator's services.
    const { services } = await getEstablishment(await establishment("COSAMA"));
    expect(services.map((s) => s.label).sort()).toEqual(["Achat d'un ticket ou d'une carte d'abonnement", "Une traversée en bateau"]);
  });

  it("adds up the lists of the sector, the type and the service, a question asked once", async () => {
    // For the test, the hospital type also gets the ticket purchase list.
    await db.exec(`UPDATE establishment_type SET question_set_id = (SELECT id FROM question_set WHERE code = 'TICKET_PURCHASE')
                   WHERE code = 'HOSPITAL'`);
    const both = "d4e5f6a7-0000-4000-8000-000000000001";
    await upsertFeedback(both, { channel: "search", establishmentId: ids.dantec, language: "fr", visitPeriod: "today" });
    const { questions } = await getDetailedQuestionnaire(both);
    // Health's five, then the purchase's (its WAIT_TIME already asked), then the common ones.
    expect(questions.map((q) => q.code)).toEqual([
      "PATIENT", "CARE_RECEIVED", "WAIT_TIME", "PRESCRIPTION_AVAILABLE", "RECEIPT_GIVEN",
      "GOAL_ACHIEVED", "PAYMENT_AS_WISHED", "REPORTED", "REPORT_WHY",
    ]);
    await db.exec("UPDATE establishment_type SET question_set_id = NULL WHERE code = 'HOSPITAL'");
  });

  it("gives GENERIC questions and topics to an establishment whose sector is unknown", async () => {
    const [{ id }] = (await rows<{ id: string }>(
      "INSERT INTO establishment (name, source, raw_input) VALUES ('Boutique de Moussa', 'user', 'Boutique de Moussa') RETURNING id",
    )) as [{ id: string }];
    const unknown = "d4e5f6a7-0000-4000-8000-000000000002";
    await upsertFeedback(unknown, { channel: "search", establishmentId: id, language: "fr", visitPeriod: "today" });
    expect((await getDetailedQuestionnaire(unknown)).questions.slice(0, 3).map((q) => q.code))
      .toEqual(["FAIR_PRICE", "RECEIPT_OR_INVOICE", "RECOMMEND"]);
    // And the GENERIC topics: the common ones plus those of a counter.
    expect((await getDetailsScreen(unknown)).topics.map((t) => t.code)).toEqual([
      "STAFF", "PROFESSIONALISM", "WAIT_TIME", "INFORMATION", "OPENING_HOURS", "FEES", "CLEANLINESS",
      "ACCESS_FOR_ALL",
    ]);
  });

  it("replaces the topics touched, each with its sentiment", async () => {
    await saveTopics(feedbackId, {
      topics: [
        { code: "WAIT_TIME", sentiment: "negative" },
        { code: "CLEANLINESS", sentiment: "negative" },
      ],
    });
    await saveTopics(feedbackId, {
      topics: [
        { code: "STAFF", sentiment: "positive" },
        { code: "FEES", sentiment: "negative" },
      ],
    });
    const topics = await rows(
      `SELECT t.code, ft.sentiment, ft.other_text FROM feedback_topic ft JOIN topic t ON t.id = ft.topic_id
       WHERE ft.feedback_id = $1 ORDER BY t.code`,
      [feedbackId],
    );
    expect(topics).toEqual([
      { code: "FEES", sentiment: "negative", other_text: null },
      { code: "STAFF", sentiment: "positive", other_text: null },
    ]);
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

  it("gives screen 2b the common topics plus the sector's, with what was already given", async () => {
    // The Grand-Yoff centre is in the Administration sector (through its type).
    const screen = await getDetailsScreen(feedbackId);
    expect(screen.answer).toMatchObject({ code: "DISSATISFIED", followUpPrompt: "Que s'est-il passé ?" });
    const codes = screen.topics.map((t) => t.code);
    expect(codes).toHaveLength(11);
    expect(codes.slice(9)).toEqual(["PROCESSING_TIME", "CASE_TRACKING"]);
    expect(screen.topics.filter((t) => t.sentiment).map((t) => [t.code, t.sentiment, t.otherText])).toEqual([
      ["STAFF", "positive", null],
      ["FEES", "negative", null],
    ]);
    expect(screen.comment).toBe("Deux heures d'attente, guichet fermé.");
  });

  it("ignores a topic of another sector, keeps the others, and removes an emptied comment", async () => {
    await saveTopics(feedbackId, {
      topics: [
        { code: "POWER_CUTS", sentiment: "negative" },
        { code: "PROCESSING_TIME", sentiment: "negative" },
      ],
    });
    await removeComment(feedbackId);
    const screen = await getDetailsScreen(feedbackId);
    expect(screen.topics.filter((t) => t.sentiment).map((t) => t.code)).toEqual(["PROCESSING_TIME"]);
    expect(screen.comment).toBeNull();
  });

  it("gives a high school its own topics, and leaves the university the Education list (0008)", async () => {
    const [school] = await rows<{ id: string }>("SELECT id FROM establishment WHERE name = 'Lycée Lamine Guèye'");
    const [university] = await rows<{ id: string }>(
      `INSERT INTO establishment (name, type_id) SELECT 'Université de test', id FROM establishment_type
       WHERE code = 'UNIVERSITY' RETURNING id`,
    );
    const topicsOf = async (feedback: string, establishmentId: string) => {
      await upsertFeedback(feedback, { channel: "search", establishmentId, language: "fr", visitPeriod: "today" });
      return (await getDetailsScreen(feedback)).topics.map((t) => t.label);
    };
    expect(await topicsOf("f6a7b8c9-0000-4000-8000-000000000004", school!.id)).toEqual([
      "Accueil et politesse",
      "Professionnalisme du personnel",
      "Simplicité de la démarche (papiers, allers-retours)",
      "Frais payés (montant, reçu)",
      "Propreté et confort",
      "Accès pour tous (personnes handicapées, âgées)",
      "Qualité de l'enseignement",
      "Encadrement des élèves",
      "Sécurité dans l'établissement",
      "Tables-bancs, matériel et manuels",
      "Échanges avec les enseignants et la direction",
    ]);
    const atUniversity = await topicsOf("a7b8c9d0-0000-4000-8000-000000000005", university!.id);
    expect(atUniversity).toContain("Temps d'attente");
    expect(atUniversity).not.toContain("Sécurité dans l'établissement");
  });

  it("adds the lists of the type and of the service to the sector's, never removing one", async () => {
    await db.exec(`
      INSERT INTO topic_set (code) VALUES ('TEST_TYPE'), ('TEST_SERVICE');
      INSERT INTO topic_set_item (topic_set_id, topic_id)
      SELECT s.id, t.id FROM (VALUES ('TEST_TYPE', 'WATER_QUALITY'), ('TEST_SERVICE', 'PRIVACY'),
                                     ('TEST_SERVICE', 'STAFF')) AS v (list, topic)
      JOIN topic_set s ON s.code = v.list JOIN topic t ON t.code = v.topic;
      UPDATE establishment_type SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'TEST_TYPE')
      WHERE code = 'CIVIL_REGISTRY_CENTER';
      UPDATE service SET topic_set_id = (SELECT id FROM topic_set WHERE code = 'TEST_SERVICE')
      WHERE code = 'CIVIL_REGISTRY_BIRTH';
    `);
    try {
      // No service: common + Administration + the type's list.
      const byType = (await getDetailsScreen(feedbackId)).topics.map((t) => t.code);
      expect(byType).toContain("WATER_QUALITY");
      expect(byType).toContain("PROCESSING_TIME");
      expect(byType).not.toContain("PRIVACY");

      // With the service: its list is added too; « Accueil », already common, comes once.
      const withService = "e5f6a7b8-0000-4000-8000-000000000003";
      const [service] = await rows<{ id: number }>("SELECT id FROM service WHERE code = 'CIVIL_REGISTRY_BIRTH'");
      await upsertFeedback(withService, {
        channel: "search", establishmentId: ids.gy, language: "fr", visitPeriod: "today", serviceId: service!.id,
      });
      const byService = (await getDetailsScreen(withService)).topics.map((t) => t.code);
      expect(byService).toEqual(expect.arrayContaining(["WATER_QUALITY", "PRIVACY", "PROCESSING_TIME"]));
      expect(byService.filter((c) => c === "STAFF")).toHaveLength(1);

      // A topic of no list of this feedback is not saved.
      await saveTopics(feedbackId, { topics: [{ code: "PRIVACY", sentiment: "negative" }] });
      expect((await getDetailsScreen(feedbackId)).topics.filter((t) => t.sentiment)).toEqual([]);
    } finally {
      await db.exec(`
        UPDATE establishment_type SET topic_set_id = NULL WHERE code = 'CIVIL_REGISTRY_CENTER';
        UPDATE service SET topic_set_id = NULL WHERE code = 'CIVIL_REGISTRY_BIRTH';
        DELETE FROM topic_set_item WHERE topic_set_id IN (SELECT id FROM topic_set WHERE code LIKE 'TEST_%');
        DELETE FROM topic_set WHERE code LIKE 'TEST_%';
      `);
    }
  });
});

describe("published results", () => {
  // On April 15, 2026: January to March are published, October to March are in the table.
  const now = new Date("2026-04-15T10:00:00Z");

  beforeAll(async () => {
    const [row] = await rows<{ id: string }>(
      `INSERT INTO establishment (name, type_id)
       VALUES ('Hôpital des résultats', (SELECT id FROM establishment_type WHERE code = 'HOSPITAL'))
       RETURNING id`,
    );
    ids.results = row!.id;
  });

  it("adds up the last 3 months and every service, and publishes from 10 feedbacks", async () => {
    await db.exec(`
      INSERT INTO feedback (id, establishment_id, service_id, channel, language, visit_period, visit_month)
      SELECT gen_random_uuid(), '${ids.results}', NULL, 'qr', 'fr', 'today', v.month::date
      FROM (VALUES ('2026-02-01'), ('2026-02-01'), ('2026-02-01'), ('2026-02-01'), ('2026-02-01'),
                   ('2026-02-01'), ('2026-02-01'), ('2026-02-01'), ('2026-02-01'), ('2026-02-01'),
                   ('2026-01-01'), ('2026-01-01'),
                   -- Out of the period: April is not complete yet, December is too old.
                   ('2026-04-01'), ('2025-12-01')) AS v (month);
      INSERT INTO answer (feedback_id, question_id, option_id)
      SELECT f.id, q.id, ao.id
      FROM feedback f, question q JOIN answer_option ao ON ao.question_id = q.id
      WHERE f.establishment_id = '${ids.results}' AND q.code = 'OVERALL_SATISFACTION'
        AND ao.code = CASE f.visit_month WHEN '2026-01-01' THEN 'DISSATISFIED' ELSE 'VERY_SATISFIED' END;
      INSERT INTO answer (feedback_id, question_id, option_id)
      SELECT f.id, q.id, ao.id
      FROM feedback f, question q JOIN answer_option ao ON ao.question_id = q.id
      WHERE f.establishment_id = '${ids.results}' AND f.visit_month = '2026-02-01'
        AND q.code = 'CARE_RECEIVED' AND ao.code = 'YES';
      INSERT INTO feedback_topic (feedback_id, topic_id, sentiment, other_text)
      SELECT f.id, t.id, v.sentiment, v.other_text
      FROM (SELECT id, row_number() OVER (ORDER BY id) AS n FROM feedback
            WHERE establishment_id = '${ids.results}' AND visit_month = '2026-02-01') AS f
      JOIN (VALUES (1, 'STAFF', 'positive', NULL), (2, 'STAFF', 'positive', NULL), (3, 'STAFF', 'positive', NULL),
                   (1, 'WAIT_TIME', 'negative', NULL), (2, 'WAIT_TIME', 'negative', NULL),
                   (1, 'OTHER', 'negative', 'Parking')) AS v (n, code, sentiment, other_text) ON v.n = f.n
      JOIN topic t ON t.code = v.code;
    `);
    await refreshPublishedStats();

    const results = await getPublishedResults(ids.results!, now);
    if (!results.published) throw new Error("expected published results");
    expect(results.period).toEqual({ from: "2026-01-01", last: "2026-03-01", publishedOn: "2026-04-01" });
    expect(results.feedbackCount).toBe(12);
    expect(results.satisfaction.options.map((o) => [o.code, o.count, o.percent])).toEqual([
      ["VERY_SATISFIED", 10, 83],
      ["SATISFIED", 0, 0],
      ["NEUTRAL", 0, 0],
      ["DISSATISFIED", 2, 17],
      ["VERY_DISSATISFIED", 0, 0],
    ]);
    expect(results.satisfaction.options[0]!.label).toBe("Très satisfait(e)");
    expect(results.satisfiedPercent).toBe(83);
    // GOAL_ACHIEVED is not asked in health: only CARE_RECEIVED shows.
    expect(results.goals.map((g) => [g.code, g.total, g.options[0]!.code, g.options[0]!.percent])).toEqual([
      ["CARE_RECEIVED", 10, "YES", 100],
    ]);
    // « Autre » (offered before 0008) is never published.
    expect(results.topics.map((t) => [t.code, t.positive, t.negative])).toEqual([
      ["STAFF", 3, 0],
      ["WAIT_TIME", 0, 2],
    ]);
    expect(results.months).toEqual([
      { month: "2025-10-01", feedbackCount: 0, satisfiedPercent: null },
      { month: "2025-11-01", feedbackCount: 0, satisfiedPercent: null },
      { month: "2025-12-01", feedbackCount: 1, satisfiedPercent: null },
      { month: "2026-01-01", feedbackCount: 2, satisfiedPercent: null },
      { month: "2026-02-01", feedbackCount: 10, satisfiedPercent: 100 },
      { month: "2026-03-01", feedbackCount: 0, satisfiedPercent: null },
    ]);
  });

  it("gives only the number of feedbacks under the threshold", async () => {
    // March 10: December to February, 1 + 2 + 10 = 13 feedbacks.
    expect((await getPublishedResults(ids.results!, new Date("2026-03-10T10:00:00Z"))).published).toBe(true);
    // June 10: March to May, only the April feedback.
    expect(await getPublishedResults(ids.results!, new Date("2026-06-10T10:00:00Z"))).toEqual({
      published: false,
      period: { from: "2026-03-01", last: "2026-05-01", publishedOn: "2026-06-01" },
      feedbackCount: 1,
      threshold: 10,
    });
  });

  it("publishes nothing for an establishment not yet validated, and refuses an unknown one", async () => {
    await db.query("UPDATE establishment SET status = 'pending_review' WHERE id = $1", [ids.results]);
    try {
      const results = await getPublishedResults(ids.results!, now);
      expect(results).toMatchObject({ published: false, feedbackCount: 12 });
    } finally {
      await db.query("UPDATE establishment SET status = 'active' WHERE id = $1", [ids.results]);
    }
    await expect(getPublishedResults("00000000-0000-4000-8000-000000000000", now)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("nightly job", () => {
  it("deletes feedbacks left at screen 1 for more than 7 days, and only those", async () => {
    const old = "a1b2c3d4-0000-4000-8000-000000000001";
    const oldAnswered = "a1b2c3d4-0000-4000-8000-000000000002";
    const recent = "a1b2c3d4-0000-4000-8000-000000000003";
    await db.exec(`
      INSERT INTO feedback (id, establishment_id, channel, language, visit_period, visit_month, started_at)
      SELECT v.id::uuid, '${ids.gy}', 'search', 'fr', 'today', date_trunc('month', now())::date,
             date_trunc('hour', now()) - v.age
      FROM (VALUES ('${old}', interval '8 days'), ('${oldAnswered}', interval '8 days'),
                   ('${recent}', interval '6 days')) AS v (id, age);
      -- Never happens through the screens, but must not block the deletion.
      INSERT INTO feedback_topic (feedback_id, topic_id, sentiment) SELECT '${old}', id, 'negative' FROM topic LIMIT 1;
    `);
    await saveAnswer(oldAnswered, "OVERALL_SATISFACTION", { option: "SATISFIED" });

    expect((await refreshPublishedStats()).abandonedDeleted).toBe(1);
    const left = await rows<{ id: string }>(
      "SELECT id::text FROM feedback WHERE id IN ($1, $2, $3) ORDER BY id",
      [old, oldAnswered, recent],
    );
    expect(left.map((r) => r.id)).toEqual([oldAnswered, recent]);
  });
});
