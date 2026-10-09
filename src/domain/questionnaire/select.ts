/** The lists of questions attached to a feedback's levels (null: nothing attached). */
export interface QuestionSetSources {
  /** False when the establishment has no sector (typed by a user without one). */
  sectorKnown: boolean;
  /** sector_question_set (0044: several per level, in order): the sector of the establishment's type, else of the establishment. */
  sectorSetIds: number[];
  /** establishment_type_question_set. */
  typeSetIds: number[];
  /** service_question_set, when a service was chosen. */
  serviceSetIds: number[];
  /** The list COMMERCE. */
  commerceSetId: number | null;
}

/**
 * Lists of questions of screen 6, in order: the sector's, then the type's,
 * then the service's, added up from the most general to the most specific
 * (a level without a list adds nothing; a level with several adds them in
 * their order). An establishment whose sector is unknown gets COMMERCE.
 */
export function selectQuestionSets(sources: QuestionSetSources): number[] {
  const lists = [
    ...(sources.sectorKnown ? sources.sectorSetIds : sources.commerceSetId === null ? [] : [sources.commerceSetId]),
    ...sources.typeSetIds,
    ...sources.serviceSetIds,
  ];
  return lists.filter((id, index) => lists.indexOf(id) === index);
}
