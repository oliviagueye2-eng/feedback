import type { EstablishmentSummary } from "@/src/domain/types";

/**
 * Under the name of an establishment: its organisation (for one of its places:
 * COSAMA under its ship), then municipality and sector, whichever are known.
 * An organisation as a whole has no municipality: only its sector shows.
 */
export const establishmentDetails = (e: EstablishmentSummary) =>
  [e.scope === "site" ? e.organizationName : null, e.municipalityName, e.sectorLabel]
    .filter(Boolean)
    .join(", ");
