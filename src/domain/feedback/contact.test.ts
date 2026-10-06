import { describe, expect, it } from "vitest";
import { parseContact } from "./contact";

describe("parseContact", () => {
  it("keeps an e-mail in lower case", () => {
    expect(parseContact("  Awa.Diop@Exemple.SN ")).toEqual({ kind: "email", value: "awa.diop@exemple.sn" });
  });

  it("writes a Senegalese number as +221 and 9 digits, however it was typed", () => {
    for (const typed of ["771234567", "77 123 45 67", "77.123.45.67", "+221 77 123 45 67", "00221771234567", "33-822-00-00"]) {
      expect(parseContact(typed).kind).toBe("phone");
    }
    expect(parseContact("+221 77 123 45 67")).toEqual({ kind: "phone", value: "+221771234567" });
    expect(parseContact("33-822-00-00")).toEqual({ kind: "phone", value: "+221338220000" });
  });

  it("refuses what is neither", () => {
    for (const typed of ["", "   ", "awa@", "awa@exemple", "12345", "7712345", "+33 6 12 34 56 78", "99 123 45 67"]) {
      expect(() => parseContact(typed)).toThrow();
    }
  });
});
