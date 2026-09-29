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
  it("has the nineteen places, all active and public", async () => {
    const { rows } = await db.query<{ n: number; active_public: number }>(`
      SELECT count(*)::int AS n,
             count(*) FILTER (WHERE status = 'active' AND ownership = 'public')::int AS active_public
      FROM establishment WHERE scope = 'site'`);
    expect(rows[0]).toEqual({ n: 19, active_public: 19 });
  });

  it("has the eleven organisations, each rated in general", async () => {
    const { rows } = await db.query<{ organizations: number; general: number }>(`
      SELECT (SELECT count(*)::int FROM organization) AS organizations,
             (SELECT count(*)::int FROM establishment WHERE scope = 'general') AS general`);
    expect(rows[0]).toEqual({ organizations: 11, general: 11 });
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

  it("shows Sen'Eau under water and Senelec under electricity", async () => {
    const [seneau, senelec] = (await searchEstablishments("sen")).results;
    expect(seneau).toMatchObject({ name: "Sen'Eau", sectorLabel: "Eau" });
    expect(senelec).toMatchObject({ name: "Senelec", sectorLabel: "Électricité" });
  });

  it("searches « hôtel de ville » as « mairie »", async () => {
    expect((await names("hotel de ville medina"))[0]).toBe("Mairie de la Médina");
    expect(await names("hôtel de ville")).toHaveLength(6);
  });

  it("with a municipality, the other words must match too", async () => {
    const found = await names("mairie grand yoff");
    expect(found[0]).toBe("Mairie de Grand Yoff");
    expect(found).not.toContain("Hôpital Général Idrissa Pouye");
    expect((await names("hopital grand yoff"))[0]).toBe("Hôpital Général Idrissa Pouye");
  });

  it("proposes nothing below 3 letters", async () => {
    expect(await names("se")).toEqual([]);
  });

  it("with 3 or 4 letters, only names with a word starting with them (Sénégal ignored)", async () => {
    expect(await names("sen")).toEqual(["Sen'Eau", "Senelec"]);
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

  it("lists the town halls for a civil registry request, the named municipality first", async () => {
    const result = await searchEstablishments("extrait de naissance Médina");
    expect(result.matchType).toBe("service");
    expect(result.results[0]?.name).toBe("Mairie de la Médina");
    expect(result.results).toHaveLength(4);
  });

  it("shows municipality and sector under the name", async () => {
    const [first] = (await searchEstablishments("Mairie de Grand Yoff")).results;
    expect(first).toMatchObject({ municipalityName: "Grand Yoff", sectorLabel: "Administration et état civil" });
  });

  it("does not offer Le Dantec, closed for reconstruction", async () => {
    expect(await names("le dantec")).toEqual([]);
  });
});
