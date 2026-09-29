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
  it("has the nineteen establishments, all active and public", async () => {
    const { rows } = await db.query<{ n: number; active_public: number }>(`
      SELECT count(*)::int AS n,
             count(*) FILTER (WHERE status = 'active' AND ownership = 'public')::int AS active_public
      FROM establishment`);
    expect(rows[0]).toEqual({ n: 19, active_public: 19 });
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
