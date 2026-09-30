import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { logoFileName, organizationLogoSrc, ORGANIZATIONS_WITH_LOGO } from "./organizationLogo";

describe("organizationLogoSrc", () => {
  it("names the file after the organisation's code", () => {
    expect(organizationLogoSrc("SENELEC", ["SENELEC"])).toBe("/logos/senelec.svg");
    expect(organizationLogoSrc("SOCIETE_GENERALE", ["SOCIETE_GENERALE"])).toBe("/logos/societe-generale.svg");
  });

  it("gives nothing without a logo or an organisation", () => {
    expect(organizationLogoSrc("YAS", ["SENELEC"])).toBeNull();
    expect(organizationLogoSrc(null, ["SENELEC"])).toBeNull();
  });
});

describe("ORGANIZATIONS_WITH_LOGO", () => {
  it("has a light SVG file in public/logos for each code", () => {
    for (const code of ORGANIZATIONS_WITH_LOGO) {
      const file = path.join(__dirname, "../../public/logos", logoFileName(code));
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeLessThan(10 * 1024);
    }
  });
});
