/**
 * The demonstration data (demo.sql) applies after the migrations, can be run
 * twice, makes the usual searches work, and can be removed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchEstablishments } from "../../domain/establishment";
import { useTestDatabase } from "../client";
import { createTestDatabase } from "../test-database";

const seed = readFileSync(path.join(__dirname, "demo.sql"), "utf8");
const remove = readFileSync(path.join(__dirname, "demo-remove.sql"), "utf8");
let db: PGlite;

const names = async (text: string) => (await searchEstablishments(text)).results.map((e) => e.name);

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
  await db.exec(seed);
  await db.exec(seed);
}, 60_000);

afterAll(async () => {
  useTestDatabase(null);
  await db?.close();
});

describe("demonstration data", () => {
  it("is not duplicated when run twice", async () => {
    const { rows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM establishment WHERE id::text LIKE 'd0000000-%'",
    );
    expect(rows[0]?.n).toBe(19);
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

  it("can be removed", async () => {
    await db.exec(remove);
    expect(await names("hoggy")).toEqual([]);
  });
});
