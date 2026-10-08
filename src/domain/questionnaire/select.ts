/** The lists of questions attached to a feedback's levels (null: nothing attached). */
export interface QuestionSetSources {
  /** False when the establishment has no sector (typed by a user without one). */
  sectorKnown: boolean;
  /** sector.question_set_id: the sector of the establishment's type, else of the establishment. */
  sectorSetId: number | null;
  /** establishment_type.question_set_id. */
  typeSetId: number | null;
  /** service.question_set_id, when a service was chosen. */
  serviceSetId: number | null;
  /** The list COMMERCE. */
  commerceSetId: number | null;
}

/**
 * Lists of questions of screen 6, in order: the sector's, then the type's,
 * then the service's, added up from the most general to the most specific
 * (a level without a list adds nothing). An establishment whose sector is
 * unknown gets COMMERCE.
 */
export function selectQuestionSets(sources: QuestionSetSources): number[] {
  const levels = [
    sources.sectorKnown ? sources.sectorSetId : sources.commerceSetId,
    sources.typeSetId,
    sources.serviceSetId,
  ];
  return levels.filter((id, index): id is number => id !== null && levels.indexOf(id) === index);
}
