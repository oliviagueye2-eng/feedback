/**
 * Organisations (migration 0005): an organisation rated at one of its places
 * or "in general". The organisation below is a test fixture, not real data.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchEstablishments } from "../domain/establishment";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;
let organizationId: number;
let generalId: string;
let agencyId: string;

const insertEstablishment = async (values: string) =>
  (await db.query<{ id: string }>(
    `INSERT INTO establishment (name, organization_id, scope, municipality_id) VALUES ${values} RETURNING id`,
  )).rows[0]!.id;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
  organizationId = (await db.query<{ id: number }>(
    `INSERT INTO organization (code, name, sector_id)
     SELECT 'TEST_LIGHT', 'Lumière Test', id FROM sector WHERE code = 'UTILITIES' RETURNING id`,
  )).rows[0]!.id;
  generalId = await insertEstablishment(`('Lumière Test', ${organizationId}, 'general', NULL)`);
  agencyId = await insertEstablishment(
    `('Agence Lumière Test de Grand Yoff', ${organizationId}, 'site',
      (SELECT id FROM municipality WHERE code = 'SN-DK-GRAND-YOFF'))`,
  );
  await insertEstablishment(
    `('Agence Lumière Test de la Médina', ${organizationId}, 'site',
      (SELECT id FROM municipality WHERE code = 'SN-DK-MEDINA'))`,
  );
}, 60_000);

afterAll(async () => {
  useTestDatabase(null);
  await db?.close();
});

describe("organisations", () => {
  it("lists the organisation in general first, then its agencies", async () => {
    const { results } = await searchEstablishments("lumiere test");
    expect(results[0]).toMatchObject({ id: generalId, scope: "general", municipalityName: null });
    expect(results).toHaveLength(3);
  });

  it("puts the agency of the municipality typed first", async () => {
    const { results } = await searchEstablishments("lumiere test grand yoff");
    expect(results[0]?.id).toBe(agencyId);
  });

  it("allows one establishment in general per organisation", async () => {
    await expect(insertEstablishment(`('Lumière Test bis', ${organizationId}, 'general', NULL)`))
      .rejects.toThrow(/establishment_one_general_per_organization/);
  });

  it("keeps an establishment in general out of any place", async () => {
    await expect(
      db.query(`INSERT INTO establishment (name, scope) VALUES ('Sans organisme', 'general')`),
    ).rejects.toThrow(/establishment_general_check/);
    await expect(
      db.query(`UPDATE establishment SET address = 'Route de Rufisque' WHERE id = $1`, [generalId]),
    ).rejects.toThrow(/establishment_general_check/);
  });

  it("refuses a QR code on an establishment in general", async () => {
    await expect(
      db.query(`INSERT INTO qr_code (code, establishment_id) VALUES ('TEST-QR', $1)`, [generalId]),
    ).rejects.toThrow(/cannot point to an "in general" establishment/);
    await db.query(`INSERT INTO qr_code (code, establishment_id) VALUES ('TEST-QR', $1)`, [agencyId]);
    await expect(
      db.query(`UPDATE establishment SET scope = 'general', municipality_id = NULL WHERE id = $1`, [agencyId]),
    ).rejects.toThrow(/cannot become "in general"/);
  });
});
