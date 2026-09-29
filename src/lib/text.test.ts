import { describe, expect, it } from "vitest";
import { normalizeForSearch } from "./text";

describe("normalizeForSearch", () => {
  it("removes accents and lowercases", () => {
    expect(normalizeForSearch("État Civil")).toBe("etat civil");
  });

  it("turns punctuation into single spaces", () => {
    expect(normalizeForSearch("  Mairie de Grand-Yoff  ")).toBe("mairie de grand yoff");
  });

  it("expands ligatures like the SQL unaccent() does", () => {
    expect(normalizeForSearch("Œuvre sociale")).toBe("oeuvre sociale");
  });

  it("keeps digits", () => {
    expect(normalizeForSearch("Poste de santé n°2")).toBe("poste de sante n 2");
  });
});
