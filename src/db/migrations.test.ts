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

  it("files the driving licence centre under Administration, a service with a file", async () => {
    const row = await one<{ sector: string; question_set: string }>(`
      SELECT s.code AS sector, qs.code AS question_set
      FROM establishment_type et
      JOIN sector s ON s.id = et.sector_id
      JOIN question_set qs ON qs.id = et.question_set_id
      WHERE et.code = 'DRIVING_LICENCE_CENTER'`);
    expect(row).toEqual({ sector: "ADMINISTRATION", question_set: "FILE_SERVICES" });
  });

  it("shows the common list plus the sector's list, without « Autre » (0008)", async () => {
    // A sector alone (no type, no service): the COMMON list plus the sector's list.
    const topicsFor = async (sector: string) =>
      (await db.query<{ code: string; label: string }>(`
        SELECT t.code, tr.label
        FROM topic t
        JOIN topic_translation tr ON tr.topic_id = t.id AND tr.language = 'fr'
        WHERE t.is_active AND EXISTS (
          SELECT 1 FROM topic_set_item i JOIN topic_set ts ON ts.id = i.topic_set_id
          WHERE i.topic_id = t.id
            AND (ts.code = 'COMMON' OR ts.id = (SELECT topic_set_id FROM sector WHERE code = $1)))
        ORDER BY t.position`, [sector])).rows;

    expect((await topicsFor("RETAIL")).map((t) => t.label)).toEqual([
      "Politesse du personnel (accueil, respect)",
      "Compétence du personnel (connaît son travail, traite bien la demande)",
      "Explications du personnel (claires, complètes)",
      "Temps d'attente",
      "Horaires d'ouverture",
      "Frais payés (montant, reçu)",
      "Propreté, entretien et confort",
      "Accessibilité aux personnes handicapées ou âgées",
    ]);

    // Electricity and water: nothing in the sector, all in the agency or at home (0019).
    expect(await topicsFor("ELECTRICITY")).toHaveLength(1);
    const serviceTopics = async (service: string) =>
      (await db.query<{ code: string }>(`
        SELECT t.code FROM topic_set_item i JOIN topic t ON t.id = i.topic_id
        WHERE i.topic_set_id = (SELECT topic_set_id FROM service WHERE code = $1) ORDER BY t.position`, [service]))
        .rows.map((r) => r.code);
    expect(await serviceTopics("ELECTRICITY_AGENCY")).toEqual([
      "STAFF", "INFORMATION", "WAIT_TIME", "PROCEDURE", "OPENING_HOURS", "FEES", "BILLING", "CLEANLINESS", "ACCESS_FOR_ALL",
    ]);
    expect(await serviceTopics("WATER_AGENCY")).toEqual(await serviceTopics("ELECTRICITY_AGENCY"));
    expect(await serviceTopics("ELECTRICITY_SUPPLY")).toEqual(["INTERVENTION_TIME", "CUSTOMER_SERVICE", "POWER_CUTS"]);
    expect(await serviceTopics("WATER_SUPPLY")).toEqual([
      "INTERVENTION_TIME", "CUSTOMER_SERVICE", "WATER_CUTS", "WATER_QUALITY",
    ]);
    expect((await topicsFor("BANKING_INSURANCE")).map((t) => t.code)).toEqual([
      "STAFF", "PROFESSIONALISM", "INFORMATION", "WAIT_TIME", "PROCESSING_TIME", "PROCEDURE", "CASE_TRACKING",
      "OPENING_HOURS", "CUSTOMER_SERVICE", "FEES", "CLEANLINESS", "ACCESS_FOR_ALL",
    ]);
    // « Simplicité de la démarche » only where there are papers.
    expect(await topicsFor("HEALTH")).toHaveLength(11);
    expect((await topicsFor("ADMINISTRATION")).map((t) => t.code)).toContain("PROCEDURE");
    // A trip has no opening hours: the transport places add them (TRANSPORT_PLACE).
    expect((await topicsFor("TRANSPORT")).map((t) => t.code)).not.toContain("OPENING_HOURS");
    // « Propreté, entretien et confort » says the state of a plane too (0009).
    expect((await topicsFor("TRANSPORT")).map((t) => t.code)).not.toContain("VEHICLE_CONDITION");
    // A trip has « Ponctualité », not « Temps d'attente »; a transport place keeps it (0009).
    expect((await topicsFor("TRANSPORT")).map((t) => t.code)).not.toContain("WAIT_TIME");
    expect((await db.query<{ code: string }>(`
      SELECT t.code FROM topic_set_item i JOIN topic t ON t.id = i.topic_id
      WHERE i.topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT_PLACE') ORDER BY t.position`))
      .rows.map((r) => r.code)).toEqual(["WAIT_TIME", "OPENING_HOURS"]);
    // A place or a ticket counter is not a trip: no « Ponctualité », no « Sécurité à bord » (0009).
    expect((await topicsFor("TRANSPORT")).map((t) => t.code)).not.toContain("PUNCTUALITY");
    expect((await db.query<{ code: string }>(`
      SELECT code FROM service WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRIP') ORDER BY code`))
      .rows.map((r) => r.code)).toEqual(["APP_RIDE", "BOAT_CROSSING", "FLIGHT", "LAND_TRIP", "STREET_TAXI_RIDE", "TRAIN_TRIP"]);
  });

  it("gives every sector a topic list, and opening hours to the transport places (0008, 0009, 0010)", async () => {
    const row = await one<{ without_list: string[]; places: string[] }>(`
      SELECT (SELECT array_agg(code) FROM sector WHERE topic_set_id IS NULL) AS without_list,
             (SELECT array_agg(code ORDER BY code) FROM (
                SELECT code, topic_set_id FROM establishment_type UNION ALL SELECT code, topic_set_id FROM service) x
              WHERE topic_set_id = (SELECT id FROM topic_set WHERE code = 'TRANSPORT_PLACE')) AS places`);
    expect(row).toEqual({ without_list: null, places: ["AIRPORT", "BUS_STATION", "PLANE_TICKET", "TICKET_PURCHASE"] });
  });

  it("puts every topic offered and every question that rates the service in a category (0009)", async () => {
    const row = await one<{ topics: string[] | null; questions: string[]; order: boolean }>(`
      SELECT (SELECT array_agg(t.code) FROM topic t
              WHERE t.category_id IS NULL AND EXISTS (SELECT 1 FROM topic_set_item i WHERE i.topic_id = t.id)) AS topics,
             (SELECT array_agg(code ORDER BY code) FROM question WHERE category_id IS NULL) AS questions,
             -- The screens follow the order of the categories, « Résultat obtenu » first (0021).
             (SELECT array_agg(code ORDER BY position) = ARRAY['OUTCOME', 'STAFF', 'DELAYS', 'PROCEDURE', 'COST',
                     'SERVICE_QUALITY', 'PREMISES'] FROM evaluation_category) AS order`);
    expect(row).toEqual({
      topics: null,
      questions: [
        "AGENCY_SUBJECT", "BOAT_INCIDENT_TYPE", "BUS_INCIDENT_TYPE", "CLASS_SIZE", "CROSSING_INCIDENT", "FIELD_SITUATION",
        "FILE_SUBMITTED", "INTERVENTION_AWAITED", "MONEY_CHANNEL", "OVERALL_SATISFACTION", "PAID_SOMETHING", "PATIENT",
        "POLICE_VISIT_REASON", "PREPAID_METER", "PRESCHOOL_RESPONDENT", "RECOMMEND", "REPORTED", "REPORT_WHY", "RESPONDENT",
        "SEWER_PROBLEM", "TELECOM_SUBJECT", "TRAIN_INCIDENT_TYPE", "TRIP_INCIDENT", "UTILITY_SUBJECT",
      ],
      order: true,
    });
  });

  it("has the bank of 78 questions (34 of 0004, 5 of 0005, 3 of 0006, 5 of 0010, 3 of 0011, 7 of 0016, 6 of 0017, 1 of 0018, 1 of 0019, 13 of 0025), each written once, every text in French", async () => {
    const row = await one<{ questions: number; sectors: number; topics: number; texts: number; prompts: number }>(`
      SELECT (SELECT count(*)::int FROM question) AS questions,
             (SELECT count(*)::int FROM sector s LEFT JOIN sector_translation t ON t.sector_id = s.id AND t.language = 'fr'
              WHERE t.label IS NULL) AS sectors,
             (SELECT count(*)::int FROM topic p LEFT JOIN topic_translation t ON t.topic_id = p.id AND t.language = 'fr'
              WHERE t.label IS NULL) AS topics,
             (SELECT count(*)::int FROM question q
              LEFT JOIN question_translation t ON t.question_id = q.id AND t.language = 'fr' WHERE t.label IS NULL)
           + (SELECT count(*)::int FROM answer_option o
              LEFT JOIN answer_option_translation t ON t.answer_option_id = o.id AND t.language = 'fr' WHERE t.label IS NULL)
             AS texts,
             (SELECT count(follow_up_prompt)::int FROM answer_option_translation) AS prompts`);
    // Nothing without its French text; the essential question keeps its 5 follow-up prompts.
    expect(row).toEqual({ questions: 78, sectors: 0, topics: 0, texts: 0, prompts: 5 });
  });

  it("attaches each list of questions where it was validated, nothing elsewhere", async () => {
    const attached = async (table: "sector" | "service" | "establishment_type") =>
      Object.fromEntries((await db.query<{ code: string; list: string | null }>(
        `SELECT x.code, qs.code AS list FROM ${table} x LEFT JOIN question_set qs ON qs.id = x.question_set_id`,
      )).rows.map((r) => [r.code, r.list]));
    expect(await attached("sector")).toEqual({
      ADMINISTRATION: "FILE_SERVICES", TAX: "FILE_SERVICES", JUSTICE: "FILE_SERVICES", SOCIAL: "FILE_SERVICES",
      HEALTH: "HEALTH", BANKING_INSURANCE: "BANKING_INSURANCE", EDUCATION: null,
      ELECTRICITY: null, WATER: null, TELECOM: null,
      RETAIL: "GENERIC", CULTURE: "GENERIC", HOSPITALITY: "GENERIC", REAL_ESTATE: "GENERIC",
      FOOD_SERVICE: "GENERIC", SPORT: "GENERIC", TOURISM: "GENERIC",
      SECURITY: null, TRANSPORT: null,
    });
    expect(await attached("service")).toEqual({
      CIVIL_REGISTRY: null, LAND_TRIP: "LAND_TRIP", BOAT_CROSSING: "BOAT_CROSSING", TICKET_PURCHASE: "TICKET_PURCHASE",
      FLIGHT: "FLIGHT", PLANE_TICKET: "TICKET_PURCHASE", SCHOOL_ADMIN: "SCHOOL_ADMIN", SCHOOL_LIFE: "SCHOOL_LIFE",
      POLICE_PREMISES: "POLICE_PREMISES", POLICE_FIELD: "POLICE_FIELD", POLICE_CALL: "POLICE_CALL",
      HIGHER_EDUCATION_ADMIN: "SCHOOL_ADMIN", HIGHER_EDUCATION_COURSES: "SCHOOL_LIFE", TRAIN_TRIP: "TRAIN_TRIP",
      APP_RIDE: "APP_RIDE", STREET_TAXI_RIDE: "STREET_TAXI_RIDE",
      ELECTRICITY_AGENCY: "ELECTRICITY_AGENCY", ELECTRICITY_SUPPLY: "ELECTRICITY_SUPPLY",
      WATER_AGENCY: "WATER_AGENCY", WATER_SUPPLY: "WATER_SUPPLY",
      // 0025: the telecom questions move from the sector to « Téléphone ou internet ».
      MOBILE_MONEY: "MOBILE_MONEY", SEWER_ISSUE: "SEWER_ISSUE", INSURANCE_CLAIM: "INSURANCE_CLAIM",
      PORT_PROCEDURE: "FILE_SERVICES", HIGHWAY_TRIP: "TOLL_HIGHWAY", TV_SUBSCRIPTION: "TV_SUBSCRIPTION",
      PHONE_INTERNET: "TELECOM",
    });
    // Types with a list of their own (0005), and « Vous êtes » on the education places (0018).
    expect(Object.fromEntries(Object.entries(await attached("establishment_type")).filter(([, list]) => list !== null)))
      .toEqual({
        AIRPORT: "AIRPORT", BUS_STATION: "BUS_STATION", DRIVING_LICENCE_CENTER: "FILE_SERVICES",
        HIGH_SCHOOL: "EDUCATION", MIDDLE_SCHOOL: "EDUCATION", PRIMARY_SCHOOL: "EDUCATION", SCHOOL_GROUP: "EDUCATION",
        UNIVERSITY: "EDUCATION", HIGHER_EDUCATION_SCHOOL: "EDUCATION", VOCATIONAL_TRAINING_CENTER: "EDUCATION",
        DAARA: "EDUCATION", PRESCHOOL: "PRESCHOOL",
      });
  });

  it("puts the same question, not a copy, in every list that asks it", async () => {
    const lists = (await db.query<{ list: string }>(
      `SELECT qs.code AS list FROM question_set_item i
       JOIN question_set qs ON qs.id = i.question_set_id JOIN question q ON q.id = i.question_id
       WHERE q.code = 'WAIT_TIME' ORDER BY qs.code`)).rows.map((r) => r.list);
    expect(lists).toEqual(["BANKING_INSURANCE", "FILE_SERVICES", "HEALTH", "POLICE_PREMISES", "SCHOOL_ADMIN", "TICKET_PURCHASE"]);
    const order = (await db.query<{ code: string }>(
      `SELECT q.code FROM question_set_item i
       JOIN question_set qs ON qs.id = i.question_set_id JOIN question q ON q.id = i.question_id
       WHERE qs.code = 'HEALTH' ORDER BY i.position`)).rows.map((r) => r.code);
    expect(order).toEqual([
      "PATIENT", "CARE_RECEIVED", "WAIT_TIME", "PRESCRIPTION_AVAILABLE", "PAID_SOMETHING", "RECEIPT_GIVEN",
    ]);
  });

  it("shows a question only after the answers its list requires", async () => {
    const conditions = (await db.query<{ list: string; question: string; depends_on: string; option: string }>(
      `SELECT qs.code AS list, q.code AS question, dq.code AS depends_on, ao.code AS option
       FROM question_condition qc
       JOIN question_set qs ON qs.id = qc.question_set_id
       JOIN question q ON q.id = qc.question_id
       JOIN question dq ON dq.id = qc.depends_on_question_id
       JOIN answer_option ao ON ao.id = qc.option_id
       ORDER BY qs.code, q.code, ao.position`)).rows.map((r) => `${r.list}: ${r.question} ← ${r.depends_on} ${r.option}`);
    expect(conditions).toEqual([
      "BANKING_INSURANCE: FEES_EXPLAINED ← PAID_SOMETHING YES",
      "BOAT_CROSSING: BOAT_INCIDENT_TYPE ← CROSSING_INCIDENT YES",
      "BOAT_CROSSING: INCIDENT_EXPLAINED ← CROSSING_INCIDENT YES",
      "BOAT_CROSSING: INCIDENT_SOLUTION ← CROSSING_INCIDENT YES",
      "COMMON: REPORTED ← OVERALL_SATISFACTION DISSATISFIED",
      "COMMON: REPORTED ← OVERALL_SATISFACTION VERY_DISSATISFIED",
      "COMMON: REPORT_WHY ← REPORTED NO",
      "ELECTRICITY_AGENCY: PREPAID_METER ← AGENCY_SUBJECT BILL",
      "ELECTRICITY_AGENCY: PREPAID_METER ← AGENCY_SUBJECT CONNECTION",
      "ELECTRICITY_SUPPLY: CUT_NOTICE ← CUTS_COUNT 1_TO_3",
      "ELECTRICITY_SUPPLY: CUT_NOTICE ← CUTS_COUNT 4_TO_10",
      "ELECTRICITY_SUPPLY: CUT_NOTICE ← CUTS_COUNT OVER_10",
      "FILE_SERVICES: RECEIPT_GIVEN ← PAID_SOMETHING YES",
      "FLIGHT: DELAY_CARE ← DEPARTURE_ON_TIME UNDER_1_H_LATE",
      "FLIGHT: DELAY_CARE ← DEPARTURE_ON_TIME OVER_1_H_LATE",
      "FLIGHT: DELAY_CARE ← DEPARTURE_ON_TIME CANCELLED",
      "FLIGHT: DELAY_INFORMED ← DEPARTURE_ON_TIME UNDER_1_H_LATE",
      "FLIGHT: DELAY_INFORMED ← DEPARTURE_ON_TIME OVER_1_H_LATE",
      "FLIGHT: DELAY_INFORMED ← DEPARTURE_ON_TIME CANCELLED",
      "GENERIC: RECEIPT_OR_INVOICE ← PAID_SOMETHING YES",
      "HEALTH: RECEIPT_GIVEN ← PAID_SOMETHING YES",
      "INSURANCE_CLAIM: CLAIM_DELAY ← CLAIM_PAID YES",
      "INSURANCE_CLAIM: CLAIM_DELAY ← CLAIM_PAID PARTLY",
      "LAND_TRIP: BUS_INCIDENT_TYPE ← TRIP_INCIDENT YES",
      "LAND_TRIP: INCIDENT_EXPLAINED ← TRIP_INCIDENT YES",
      "LAND_TRIP: INCIDENT_SOLUTION ← TRIP_INCIDENT YES",
      "MOBILE_MONEY: AGENT_CASH ← MONEY_CHANNEL AGENT",
      "MOBILE_MONEY: MONEY_PROBLEM_SOLVED ← MONEY_OPERATION_OK FAILED",
      "MOBILE_MONEY: MONEY_PROBLEM_SOLVED ← MONEY_OPERATION_OK BLOCKED",
      "POLICE_FIELD: RECEIPT_GIVEN ← PAID_SOMETHING YES",
      "POLICE_PREMISES: RECEIPT_GIVEN ← PAID_SOMETHING YES",
      "POLICE_PREMISES: STATEMENT_RECEIPT ← POLICE_VISIT_REASON COMPLAINT",
      "POLICE_PREMISES: STATEMENT_RECEIPT ← POLICE_VISIT_REASON LOSS",
      "SCHOOL_ADMIN: RECEIPT_GIVEN ← PAID_SOMETHING YES",
      "STREET_TAXI_RIDE: PRICE_KEPT ← PRICE_AGREED YES",
      "TELECOM: NETWORK_LOSS ← TELECOM_SUBJECT CALLS_SMS",
      "TELECOM: NETWORK_LOSS ← TELECOM_SUBJECT MOBILE_INTERNET",
      "TELECOM: NETWORK_LOSS ← TELECOM_SUBJECT HOME_INTERNET",
      "TRAIN_TRIP: INCIDENT_EXPLAINED ← TRIP_INCIDENT YES",
      "TRAIN_TRIP: INCIDENT_SOLUTION ← TRIP_INCIDENT YES",
      "TRAIN_TRIP: TRAIN_INCIDENT_TYPE ← TRIP_INCIDENT YES",
      "WATER_SUPPLY: CUT_NOTICE ← DAYS_WITHOUT_WATER 1_TO_3",
      "WATER_SUPPLY: CUT_NOTICE ← DAYS_WITHOUT_WATER 4_TO_10",
      "WATER_SUPPLY: CUT_NOTICE ← DAYS_WITHOUT_WATER OVER_10",
    ]);
    // A condition on an answer of another question is refused.
    await expect(db.query(
      `INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
       SELECT qs.id, q.id, dq.id, (SELECT id FROM answer_option WHERE code = 'POINTLESS')
       FROM question_set qs, question q, question dq
       WHERE qs.code = 'COMMON' AND q.code = 'REPORT_WHY' AND dq.code = 'OVERALL_SATISFACTION'`,
    )).rejects.toThrow(/foreign key/);
    // The yes/no question always comes right before the questions it opens (0011).
    const before = (await db.query<{ list: string; question: string; previous: string }>(
      `SELECT qs.code AS list, q.code AS question, pq.code AS previous
       FROM question_condition qc
       JOIN question_set qs ON qs.id = qc.question_set_id
       JOIN question q ON q.id = qc.question_id
       JOIN question dq ON dq.id = qc.depends_on_question_id
       JOIN question_set_item i ON i.question_set_id = qc.question_set_id AND i.question_id = qc.question_id
       JOIN question_set_item p ON p.question_set_id = i.question_set_id AND p.position = i.position - 1
       JOIN question pq ON pq.id = p.question_id
       WHERE dq.code IN ('PAID_SOMETHING', 'INTERVENTION_AWAITED')`)).rows;
    expect(before).toHaveLength(7);
    expect(before.every((r) => ["PAID_SOMETHING", "INTERVENTION_AWAITED"].includes(r.previous))).toBe(true);
    // A real service keeps its French label (then its synonyms) in its search_text.
    expect((await one<{ search_text: string }>(
      "SELECT search_text FROM service WHERE code = 'CIVIL_REGISTRY'"))?.search_text,
    ).toMatch(/^etat civil extrait de naissance /);
  });
});

describe("« Non concerné » and the questions that open a topic (0011)", () => {
  it("opens three topics after « Oui » (the intervention's question removed by 0012), and no longer offers « Je n'ai rien payé »", async () => {
    const conditions = (await db.query<{ topic: string; question: string; option: string }>(
      `SELECT t.code AS topic, q.code AS question, ao.code AS option
       FROM topic_condition tc
       JOIN topic t ON t.id = tc.topic_id
       JOIN question q ON q.id = tc.depends_on_question_id
       JOIN answer_option ao ON ao.id = tc.option_id
       ORDER BY t.code`)).rows.map((r) => `${r.topic} ← ${r.question} ${r.option}`);
    expect(conditions).toEqual([
      "CASE_TRACKING ← FILE_SUBMITTED YES",
      "FEES ← PAID_SOMETHING YES",
      "PROCESSING_TIME ← FILE_SUBMITTED YES",
    ]);
    const inactive = (await db.query<{ code: string }>(
      `SELECT q.code || ' ' || ao.code AS code FROM answer_option ao JOIN question q ON q.id = ao.question_id
       WHERE NOT ao.is_active ORDER BY 1`)).rows.map((r) => r.code);
    // « Mobile money » has its own service since 0025 (0026).
    expect(inactive).toEqual(["RECEIPT_GIVEN NOTHING_PAID", "RECEIPT_OR_INVOICE NOTHING_PAID", "TELECOM_SUBJECT MOBILE_MONEY"]);
  });

  it("accepts « Non concerné » as a sentiment, and nothing else", async () => {
    const definition = await one<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'feedback_topic_sentiment_check'`);
    expect(definition?.def).toContain("not_concerned");
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
      `INSERT INTO feedback (id, establishment_id, channel, language, visit_period, visit_month, step, completed_at)
       VALUES ($1, $2, 'qr', 'fr', 'today', '2026-03-01', 'completed', date_trunc('hour', now()))`,
      [recent, merged],
    );
    // Sent from the last screen: only those count in the published results (0024).
    await db.query(
      "INSERT INTO feedback_contact (feedback_id, kind, value) VALUES ($1, 'email', 'awa@exemple.sn')",
      [recent],
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
    // The counts behind the results page (0007) follow the merge the same way.
    await db.exec("REFRESH MATERIALIZED VIEW monthly_answer_counts");
    const counts = await one<{ establishment_id: string; month: string; answer_count: number }>(
      "SELECT establishment_id, to_char(month, 'YYYY-MM') AS month, answer_count FROM monthly_answer_counts",
    );
    expect(counts).toEqual({ establishment_id: establishmentId, month: "2026-03", answer_count: 1 });
  });
});
