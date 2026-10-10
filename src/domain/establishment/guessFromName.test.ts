import { describe, expect, it } from "vitest";
import type { EstablishmentType } from "../types";
import { guessFromName } from "./guessFromName";

const TYPES: EstablishmentType[] = [
  { code: "TOWN_HALL", label: "Mairie", sectorCode: "ADMINISTRATION" },
  { code: "HIGH_SCHOOL", label: "Lycée", sectorCode: "EDUCATION" },
  { code: "MIDDLE_SCHOOL", label: "Collège (CEM)", sectorCode: "EDUCATION" },
  { code: "PRESCHOOL", label: "Case des tout-petits ou école maternelle", sectorCode: "EDUCATION" },
  { code: "HEALTH_POST", label: "Poste de santé", sectorCode: "HEALTH" },
  { code: "POSTAL_OPERATOR", label: "Poste", sectorCode: "DELIVERY" },
  { code: "COURT", label: "Tribunal ou cour", sectorCode: "JUSTICE" },
  { code: "SOCIAL_SECURITY_OFFICE", label: "Agence de sécurité sociale ou de retraite", sectorCode: "SOCIAL" },
  { code: "MARKET", label: "Marché", sectorCode: "RETAIL" },
  { code: "SUPERMARKET", label: "Supermarché", sectorCode: "RETAIL" },
];

const guess = (name: string) => {
  const { type, locality } = guessFromName(name, TYPES);
  return { type: type?.code ?? null, locality };
};

describe("guessFromName", () => {
  it("finds the type and keeps the rest as the locality", () => {
    expect(guess("mairie Touba")).toEqual({ type: "TOWN_HALL", locality: "Touba" });
  });

  it("ignores case and accents, and keeps the locality as typed", () => {
    expect(guess("LYCEE de Kaolack")).toEqual({ type: "HIGH_SCHOOL", locality: "Kaolack" });
  });

  it("drops the link words and elisions before the locality", () => {
    expect(guess("Mairie de la Médina")).toEqual({ type: "TOWN_HALL", locality: "Médina" });
    expect(guess("Mairie d'Oussouye")).toEqual({ type: "TOWN_HALL", locality: "Oussouye" });
  });

  it("finds the type anywhere in the name", () => {
    expect(guess("Touba mairie")).toEqual({ type: "TOWN_HALL", locality: "Touba" });
  });

  it("prefers the longest label", () => {
    expect(guess("poste de santé Ndiarème")).toEqual({ type: "HEALTH_POST", locality: "Ndiarème" });
    expect(guess("poste Touba")).toEqual({ type: "POSTAL_OPERATOR", locality: "Touba" });
  });

  it("finds each side of « ou », but not a side that only completes the other", () => {
    expect(guess("tribunal de Kolda")).toEqual({ type: "COURT", locality: "Kolda" });
    expect(guess("école maternelle Pikine")).toEqual({ type: "PRESCHOOL", locality: "Pikine" });
    expect(guess("caisse de retraite")).toEqual({ type: null, locality: "" });
  });

  it("ignores what is in brackets", () => {
    expect(guess("collège Thiaroye")).toEqual({ type: "MIDDLE_SCHOOL", locality: "Thiaroye" });
  });

  it("matches whole words only", () => {
    expect(guess("supermarché Touba")).toEqual({ type: "SUPERMARKET", locality: "Touba" });
  });

  it("guesses nothing when two types tie", () => {
    expect(guess("mairie lycée")).toEqual({ type: null, locality: "" });
  });

  it("guesses nothing without a type, and leaves the locality empty", () => {
    expect(guess("Grande mosquée de Touba")).toEqual({ type: null, locality: "" });
  });

  it("leaves the locality empty when the name is only the type", () => {
    expect(guess("Mairie")).toEqual({ type: "TOWN_HALL", locality: "" });
  });
});
