import { describe, expect, it } from "vitest";
import type { EstablishmentSummary } from "@/src/domain/types";
import { establishmentDetails } from "./establishmentDetails";

const base: EstablishmentSummary = {
  id: "x",
  name: "Aline Sitoë Diatta (bateau Dakar – Ziguinchor)",
  municipalityName: null,
  typeCode: null,
  sectorLabel: "Transport",
  scope: "site",
  organizationCode: "COSAMA",
  organizationName: "COSAMA",
};

describe("establishmentDetails", () => {
  it("names the organisation under one of its places", () => {
    expect(establishmentDetails(base)).toBe("COSAMA, Transport");
    expect(establishmentDetails({ ...base, municipalityName: "Pikine" })).toBe("COSAMA, Pikine, Transport");
  });

  it("does not repeat the organisation under its « in general » establishment", () => {
    expect(establishmentDetails({ ...base, name: "COSAMA", scope: "general" })).toBe("Transport");
  });

  it("shows municipality and sector of an establishment without organisation", () => {
    expect(
      establishmentDetails({ ...base, organizationCode: null, organizationName: null, municipalityName: "Médina", sectorLabel: "Administration" }),
    ).toBe("Médina, Administration");
  });
});
