export const GENERIC_QUESTIONNAIRE_CODE = "GENERIC";

export interface QuestionnaireSources {
  /** service.detailed_questionnaire_id, when the service is known. */
  serviceQuestionnaireId: number | null;
  /** establishment_type.detailed_questionnaire_id, when the type has one (e.g. airport). */
  typeQuestionnaireId: number | null;
  /** sector.fallback_questionnaire_id, when the sector is known. */
  sectorFallbackQuestionnaireId: number | null;
}

export type SelectedQuestionnaire =
  | { kind: "service" | "type" | "sector"; id: number }
  | { kind: "generic"; code: typeof GENERIC_QUESTIONNAIRE_CODE };

/**
 * Detailed questionnaire (screen 6): the service's own questionnaire,
 * otherwise the establishment type's, otherwise the sector's fallback,
 * otherwise the generic one.
 */
export function selectDetailedQuestionnaire(
  sources: QuestionnaireSources,
): SelectedQuestionnaire {
  if (sources.serviceQuestionnaireId !== null) {
    return { kind: "service", id: sources.serviceQuestionnaireId };
  }
  if (sources.typeQuestionnaireId !== null) {
    return { kind: "type", id: sources.typeQuestionnaireId };
  }
  if (sources.sectorFallbackQuestionnaireId !== null) {
    return { kind: "sector", id: sources.sectorFallbackQuestionnaireId };
  }
  return { kind: "generic", code: GENERIC_QUESTIONNAIRE_CODE };
}
