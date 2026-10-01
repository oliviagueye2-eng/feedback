/**
 * Conditions of the questions of screen 6 (table question_condition): a
 * question with conditions is shown only if the question it depends on got
 * one of the listed answers. A question without conditions is always shown.
 */
export interface QuestionCondition {
  /** Code of the question it depends on (ESSENTIAL, or an earlier one). */
  dependsOn: string;
  /** Answers of that question that show this one. */
  options: string[];
}

export interface ConditionalQuestion {
  code: string;
  conditions: QuestionCondition[];
}

/**
 * On the page: whether each question is shown, and when it depends on an
 * earlier question of the same page, which answer reveals it (the page shows
 * it as soon as that answer is touched). `answers`: what the feedback already
 * answered, by question code (essential answer included).
 */
export function questionsToShow<Q extends ConditionalQuestion>(
  questions: Q[],
  answers: Record<string, string | null>,
): (Q & { revealedBy: QuestionCondition | null })[] {
  const shown: (Q & { revealedBy: QuestionCondition | null })[] = [];
  for (const question of questions) {
    let revealedBy: QuestionCondition | null = null;
    const ok = question.conditions.every((condition) => {
      if (shown.some((q) => q.code === condition.dependsOn)) {
        revealedBy = condition;
        return true;
      }
      // A question of this page that is not shown hides the ones depending on it.
      if (questions.some((q) => q.code === condition.dependsOn)) return false;
      const answer = answers[condition.dependsOn];
      return answer != null && condition.options.includes(answer);
    });
    if (ok) shown.push({ ...question, revealedBy });
  }
  return shown;
}

/**
 * Once the answers are final (end of the feedback): the questions whose
 * conditions are not met by the answers given. Their answers no longer
 * apply (e.g. « Pourquoi ? » answered, then « Non » changed to « Oui »).
 */
export function questionsNotApplicable<Q extends ConditionalQuestion>(
  questions: Q[],
  answers: Record<string, string | null>,
): Q[] {
  const applicable = new Set<string>();
  const result: Q[] = [];
  for (const question of questions) {
    const ok = question.conditions.every((condition) => {
      const answer = answers[condition.dependsOn];
      const dependsOnApplies =
        applicable.has(condition.dependsOn) || !questions.some((q) => q.code === condition.dependsOn);
      return dependsOnApplies && answer != null && condition.options.includes(answer);
    });
    if (ok) applicable.add(question.code);
    else result.push(question);
  }
  return result;
}
