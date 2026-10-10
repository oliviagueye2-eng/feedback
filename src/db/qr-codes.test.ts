/**
 * QR codes of the back-office against an in-memory PostgreSQL with the real
 * migrations: places of an organisation, codes per place or counter, the scan,
 * switching a code off, and the posters.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addOrganizationSite,
  createMissingOrganizationCodes,
  createQrCode,
  getQrEstablishment,
  getQrOrganization,
  listQrPosters,
  searchQrTargets,
  setQrCodeActive,
} from "../domain/admin";
import { getEstablishmentByQrCode } from "../domain/establishment";
import { newQrCode, normalizeQrCode, qrMatrix, qrUrl } from "../lib/qr";
import { useTestDatabase } from "./client";
import { createTestDatabase } from "./test-database";

let db: PGlite;

const rows = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

beforeAll(async () => {
  db = await createTestDatabase();
  useTestDatabase(db);
});

afterAll(async () => {
  useTestDatabase(null);
  await db.close();
});

describe("codes", () => {
  it("are 8 characters without 0, O, 1, I or L, read in any case", () => {
    const codes = Array.from({ length: 200 }, newQrCode);
    for (const code of codes) expect(code).toMatch(/^[2-9A-HJKMNP-Z]{8}$/);
    expect(new Set(codes).size).toBe(codes.length);
    expect(normalizeQrCode(" ab cd2345 ")).toBe("ABCD2345");
  });

  it("hold the address on the main domain", () => {
    expect(qrUrl("ABCD2345")).toBe("https://neexnaxari.com/e/ABCD2345");
    const matrix = qrMatrix(qrUrl("ABCD2345"));
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
  });
});

describe("an organisation's places", () => {
  it("are added active, named after the town, with the type of the organisation", async () => {
    const id = await addOrganizationSite("LA_POSTE", "  Médina ");
    const [site] = await rows<{ name: string; status: string; scope: string; municipality: string | null; same_type: boolean }>(
      `SELECT e.name, e.status, e.scope, m.name AS municipality,
              e.type_id IS NOT DISTINCT FROM g.type_id AND e.sector_id IS NOT DISTINCT FROM g.sector_id AS same_type
       FROM establishment e
       LEFT JOIN municipality m ON m.id = e.municipality_id
       JOIN establishment g ON g.organization_id = e.organization_id AND g.scope = 'general'
       WHERE e.id = $1`,
      [id],
    );
    expect(site).toEqual({ name: "La Poste – Médina", status: "active", scope: "site", municipality: "Médina", same_type: true });
    expect(await addOrganizationSite("LA_POSTE", "medina")).toBe(id);
    await expect(addOrganizationSite("LA_POSTE", "x")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(addOrganizationSite("UNKNOWN", "Médina")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("each get one code at once, and only those without one", async () => {
    await addOrganizationSite("LA_POSTE", "Thiès");
    const first = await createMissingOrganizationCodes("LA_POSTE");
    expect(first).toHaveLength(2);
    await addOrganizationSite("LA_POSTE", "Touba");
    expect(await createMissingOrganizationCodes("LA_POSTE")).toHaveLength(1);
    const organization = await getQrOrganization("LA_POSTE");
    expect(organization?.sites.map((s) => [s.name, s.activeCodes.length])).toEqual([
      ["La Poste – Médina", 1],
      ["La Poste – Thiès", 1],
      ["La Poste – Touba", 1],
    ]);
  });

  it("are found by the name of the organisation or the town", async () => {
    const found = await searchQrTargets("poste");
    expect(found?.organizations.map((o) => [o.code, o.sites])).toEqual([["LA_POSTE", 3]]);
    expect((await searchQrTargets("poste thies"))?.establishments.map((e) => e.name)).toEqual(["La Poste – Thiès"]);
    expect(await searchQrTargets("p")).toBeNull();
  });
});

describe("a code", () => {
  let placeId: string;

  beforeAll(async () => {
    placeId = (await rows<{ id: string }>(`SELECT id FROM establishment WHERE name = 'La Poste – Médina'`))[0]!.id;
  });

  it("can name a counter: a service offered there and a location", async () => {
    const place = await getQrEstablishment(placeId);
    const service = place!.services[0]!;
    const code = await createQrCode(placeId, { serviceId: String(service.id), locationLabel: " Guichet 2 " });
    const scanned = await getEstablishmentByQrCode(code.toLowerCase());
    expect(scanned.establishment.id).toBe(placeId);
    expect(scanned.serviceId).toBe(service.id);
    const [poster] = await listQrPosters([code]);
    expect(poster).toMatchObject({ establishmentName: "La Poste – Médina", serviceLabel: service.label, locationLabel: "Guichet 2" });
  });

  it("refuses a service the place does not offer, a long location, and an « in general »", async () => {
    const [other] = await rows<{ id: number }>(
      `SELECT s.id FROM service s WHERE NOT EXISTS (SELECT 1 FROM establishment_offer eo WHERE eo.establishment_id = $1 AND eo.service_id = s.id) LIMIT 1`,
      [placeId],
    );
    await expect(createQrCode(placeId, { serviceId: String(other!.id), locationLabel: "" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(createQrCode(placeId, { serviceId: "", locationLabel: "x".repeat(61) })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const [general] = await rows<{ id: string }>(
      `SELECT e.id FROM establishment e JOIN organization o ON o.id = e.organization_id WHERE o.code = 'LA_POSTE' AND e.scope = 'general'`,
    );
    await expect(createQrCode(general!.id, { serviceId: "", locationLabel: "" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await getQrEstablishment(general!.id)).toBeNull();
  });

  it("switched off, is no longer scanned nor printed, and can be switched on again", async () => {
    const code = await createQrCode(placeId, { serviceId: "", locationLabel: "" });
    expect(await setQrCodeActive(code, false)).toBe(placeId);
    await expect(getEstablishmentByQrCode(code)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await listQrPosters([code])).toEqual([]);
    const place = await getQrEstablishment(placeId);
    expect(place!.codes.at(-1)).toMatchObject({ code, isActive: false });
    await setQrCodeActive(code, true);
    expect((await getEstablishmentByQrCode(code)).establishment.id).toBe(placeId);
    await expect(setQrCodeActive("NOPE2345", false)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("prints posters in the order asked, once each", async () => {
    const codes = (await getQrOrganization("LA_POSTE"))!.sites.map((s) => s.activeCodes[0]!);
    const posters = await listQrPosters([...codes].reverse().concat(codes[0]!.toLowerCase()));
    expect(posters.map((p) => p.code)).toEqual([...codes].reverse());
  });
});
