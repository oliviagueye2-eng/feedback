/**
 * Logos of organisations (Senelec, Orange…). A logo is a file in public/logos/
 * named after the organisation's code (organization.code), in lower case with
 * dashes: SENELEC → senelec.svg, SOCIETE_GENERALE → societe-generale.svg. The
 * places of an organisation (its agencies, its "in general") show its logo;
 * other establishments keep the building pictogram.
 *
 * Adding a logo: put the SVG file (under 10 KB) in public/logos/, then add the
 * code below (a test checks that each code has its file). Before publishing a
 * logo, check that the organisation agrees to its use.
 */
const ORGANIZATIONS_WITH_LOGO: readonly string[] = [];

/** File name of an organisation's logo, whether or not it exists. */
export const logoFileName = (code: string) => `${code.toLowerCase().replace(/_/g, "-")}.svg`;

/** Address of the organisation's logo, or null when it has none. */
export function organizationLogoSrc(code: string | null, withLogo = ORGANIZATIONS_WITH_LOGO): string | null {
  return code && withLogo.includes(code) ? `/logos/${logoFileName(code)}` : null;
}

export { ORGANIZATIONS_WITH_LOGO };
