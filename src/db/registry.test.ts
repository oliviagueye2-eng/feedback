/**
 * The first real establishments (migration 0004) make the usual searches work.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchEstablishments } from "../domain/establishment";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;

const names = async (text: string) => (await searchEstablishments(text)).results.map((e) => e.name);

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
}, 60_000);

afterAll(async () => {
  useTestDatabase(null);
  await db?.close();
});

describe("first establishments of the registry", () => {
  it("has the twenty-six places, all active, public but COSAMA's ship", async () => {
    const { rows } = await db.query<{ n: number; active_public: number }>(`
      SELECT count(*)::int AS n,
             count(*) FILTER (WHERE status = 'active' AND ownership = 'public')::int AS active_public
      FROM establishment WHERE scope = 'site'`);
    // 19 public places (0004), the ship Aline Sitoë Diatta (0019, private operator) and 6 universities (0025).
    expect(rows[0]).toEqual({ n: 26, active_public: 25 });
  });

  it("has the validated types (0005, driving licence centre moved to Administration in 0008)", async () => {
    const { rows } = await db.query<{ sector: string; n: number }>(`
      SELECT s.code AS sector, count(*)::int AS n
      FROM establishment_type t JOIN sector s ON s.id = t.sector_id
      JOIN establishment_type_translation tt ON tt.establishment_type_id = t.id AND tt.language = 'fr'
      GROUP BY s.code ORDER BY s.code`);
    expect(rows).toEqual([
      { sector: "ADMINISTRATION", n: 8 },
      { sector: "CULTURE", n: 4 },
      { sector: "EDUCATION", n: 9 },
      { sector: "HEALTH", n: 8 },
      { sector: "JUSTICE", n: 5 },
      { sector: "RETAIL", n: 4 },
      { sector: "SECURITY", n: 3 },
      { sector: "SOCIAL", n: 5 },
      { sector: "SPORT", n: 3 },
      { sector: "TAX", n: 6 },
      { sector: "TOURISM", n: 2 },
      { sector: "TRANSPORT", n: 2 },
    ]);
  });

  it("asks health places what they came for, care, medicines or a test (0005)", async () => {
    const { rows } = await db.query<{ label: string }>(`
      SELECT t.label FROM question_translation t JOIN question q ON q.id = t.question_id
      WHERE q.code = 'CARE_RECEIVED' AND t.language = 'fr'`);
    expect(rows[0]?.label).toBe("Avez-vous reçu ce pour quoi vous étiez venu(e) (soins, médicaments, examen) ?");
  });

  it("gives a type of its own sector to every public place", async () => {
    const { rows } = await db.query<{ name: string }>(`
      SELECT e.name FROM establishment e
      LEFT JOIN establishment_type t ON t.id = e.type_id
      WHERE e.scope = 'site' AND e.organization_id IS NULL
        AND (t.id IS NULL OR t.sector_id <> e.sector_id)`);
    expect(rows).toEqual([]);
  });

  it("has the ninety-one organisations, each rated in general", async () => {
    const { rows } = await db.query<{ organizations: number; general: number }>(`
      SELECT (SELECT count(*)::int FROM organization) AS organizations,
             (SELECT count(*)::int FROM establishment WHERE scope = 'general') AS general`);
    // 11 organisations, the 5 transport operators (0003), Air Sénégal (0006), the police and the gendarmerie (0010),
    // 26 more banks (0022) and 41 more organisations (0025).
    // Orange Money and Mixx by Yas (0027).
    expect(rows[0]).toEqual({ organizations: 91, general: 91 });
  });

  it("finds an organisation by its usual name, full name or former name", async () => {
    const first = async (text: string) => (await searchEstablishments(text)).results[0];
    expect(await first("senelec")).toMatchObject({ name: "Senelec", scope: "general", municipalityName: null });
    expect((await first("societe nationale d'electricite"))?.name).toBe("Senelec");
    expect((await first("free"))?.name).toBe("Yas");
    expect((await first("sgbs"))?.name).toBe("Société Générale");
    expect((await first("seneau"))?.name).toBe("Sen'Eau");
    expect((await first("impots"))?.name).toBe("DGID");
    expect((await first("la poste"))?.name).toBe("La Poste");
  });

  it("finds the banks by their short name, official name or former name (0022)", async () => {
    const first = async (text: string) => (await searchEstablishments(text)).results[0];
    expect((await first("bhs"))?.name).toBe("BHS");
    expect((await first("banque de l'habitat"))?.name).toBe("BHS");
    expect((await first("bicis"))?.name).toBe("Sunu Bank");
    expect((await first("cncas"))?.name).toBe("La Banque Agricole");
    expect((await first("orabank"))?.name).toBe("Orabank");
    expect((await first("sgsn"))?.name).toBe("Société Générale");
    const { rows } = await db.query<{ n: number }>(`
      SELECT count(*)::int AS n FROM organization o JOIN sector s ON s.id = o.sector_id
      WHERE s.code = 'BANKING_INSURANCE'`);
    // 29 banks, 16 insurers and 6 microfinance institutions (0025); Wave,
    // Orange Money and Mixx by Yas moved to « Paiement mobile » (0030).
    expect(rows[0]?.n).toBe(51);
  });

  it("finds the new organisations by their name or an everyday word (0025)", async () => {
    const first = async (text: string) => (await searchEstablishments(text)).results[0];
    expect((await first("wave"))?.name).toBe("Wave");
    expect((await first("caisse de securite sociale"))?.name).toBe("CSS");
    expect((await first("cmu"))?.name).toBe("Agence de la CMU");
    expect((await first("onas"))?.name).toBe("ONAS");
    expect((await first("douane"))?.name).toBe("Douanes");
    expect((await first("peage"))?.name).toBe("Autoroute à péage");
    expect((await first("uidt"))?.name).toBe("Université Iba Der Thiam de Thiès");
  });

  it("finds only the brand searched for, not the other mobile money operators (0026)", async () => {
    expect(await names("wave")).toEqual(["Wave"]);
    // Orange Money and Mixx by Yas are organisations of their own (0027).
    expect((await searchEstablishments("orange money")).results[0]?.name).toBe("Orange Money");
    expect((await searchEstablishments("mixx")).results[0]?.name).toBe("Mixx by Yas");
  });

  it("shows Sen'Eau under water and Senelec under electricity", async () => {
    const results = (await searchEstablishments("sen")).results;
    const [seneau, senelec] = ["Sen'Eau", "Senelec"].map((name) => results.find((r) => r.name === name));
    expect(seneau).toMatchObject({ name: "Sen'Eau", sectorLabel: "Eau" });
    expect(senelec).toMatchObject({ name: "Senelec", sectorLabel: "Électricité" });
  });

  it("searches « hôtel de ville » as « mairie »", async () => {
    expect(await names("hotel de ville medina")).toEqual(["Mairie de la Médina"]);
    expect(await names("hôtel de ville")).toHaveLength(6);
  });

  it("with a municipality, the other words must match too", async () => {
    expect(await names("mairie grand yoff")).not.toContain("Hôpital Général Idrissa Pouye");
  });

  it("proposes nothing below 3 letters", async () => {
    expect(await names("se")).toEqual([]);
  });

  it("with 3 or 4 letters, only names with a word starting with them (Sénégal ignored)", async () => {
    // Displayed names first (« Sénégalaise » is not « Sénégal »); COSAMA (« sénégalais »),
    // LONASE (« sénégalaise ») and TER (« SENTER ») by an alias only.
    expect(await names("sen")).toEqual(["Sen'Eau", "La Sécurité Sénégalaise", "Senelec", "COSAMA", "LONASE", "TER"]);
    expect(await names("ucad")).toEqual(["Université Cheikh Anta Diop de Dakar"]);
    expect(await names("snl")).toEqual([]);
  });

  it("from 5 letters, tolerates typos", async () => {
    expect(await names("senelc")).toContain("Senelec");
  });

  it("puts a match on the displayed name before a match on an alias only", async () => {
    // "free" is only an alias of Yas; "Hôpital Fann" an alias, but "Fann" is in no displayed name.
    const orange = await names("orange");
    expect(orange[0]).toBe("Orange");
  });

  it("does not offer La Poste for a health post", async () => {
    expect(await names("poste de sante")).not.toContain("La Poste");
  });

  it("finds establishments by their everyday name", async () => {
    expect(await names("hoggy")).toContain("Hôpital Général Idrissa Pouye");
    expect(await names("aibd")).toContain("Aéroport international Blaise Diagne");
    expect((await names("hopital principal"))[0]).toBe("Hôpital Principal de Dakar");
    expect((await names("ucad"))[0]).toBe("Université Cheikh Anta Diop de Dakar");
  });

  it("lists the town halls for a civil registry request", async () => {
    const result = await searchEstablishments("extrait de naissance");
    expect(result.matchType).toBe("service");
    expect(result.results).toHaveLength(4);
  });

  it("shows only the establishments of the municipality typed, when there are some", async () => {
    expect(await names("extrait de naissance Médina")).toEqual(["Mairie de la Médina"]);
    expect(await names("mairie de grand yoff")).toEqual(["Mairie de Grand Yoff"]);
    expect(await names("hopital grand yoff")).toEqual(["Hôpital Général Idrissa Pouye"]);
    // Nothing in that municipality: the others are shown.
    expect(await names("universite grand yoff")).toContain("Université Cheikh Anta Diop de Dakar");
  });

  it("shows municipality and sector under the name", async () => {
    const [first] = (await searchEstablishments("Mairie de Grand Yoff")).results;
    expect(first).toMatchObject({ municipalityName: "Grand Yoff", sectorLabel: "Administration et état civil" });
  });

  it("does not offer Le Dantec, closed for reconstruction", async () => {
    expect(await names("le dantec")).toEqual([]);
  });
});
