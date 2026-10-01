import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { getQuestionnaireScreen } from "@/src/domain/feedback";
import { saveDetailedAnswers } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { getDictionary } from "../../../../_i18n";
import { fill } from "../../../../_i18n/format";
import { frenchSpaces } from "../../../../_i18n/typography";
import styles from "../../../_feedback/screen.module.css";

/** Over this many characters, an answer is a sentence: one per row. */
const LONG_ANSWER = 24;

/**
 * Screen 6: the detailed questionnaire of the feedback's service or sector, then
 * the common questions (only for the users not satisfied), all on one page,
 * each one optional (not answering is how to skip it).
 * « Continuer » saves what was answered, completes the feedback, then screen 7.
 * Real radio buttons: works without JavaScript.
 */
export default async function QuestionnairePage({ params, searchParams }: PageProps<"/donner/[feedbackId]/questionnaire">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  let screen;
  try {
    screen = await getQuestionnaireScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, questions } = screen;
  // Reached without answering the essential question: back to it.
  if (!context.essentialOption) redirect(`/donner/${feedbackId}`);
  // No questionnaire for this feedback (anymore): screen 2b ends it.
  if (questions.length === 0) redirect(`/donner/${feedbackId}/precisions`);
  const { common, questionnaire: t } = await getDictionary();

  // A question revealed by an answer of the page (« Pourquoi ? » after « Non »):
  // hidden until that answer is touched, where the browser knows :has().
  // Without it, the question stays visible with its hint.
  const revealLabels = (condition: { dependsOn: string; options: string[] }) =>
    (questions.find((q) => q.code === condition.dependsOn)?.options ?? [])
      .filter((o) => condition.options.includes(o.code))
      .map((o) => frenchSpaces(`« ${o.label} »`))
      .join(t.or);
  const revealRules = questions
    .filter((q) => q.revealedBy)
    .map((q) => {
      const { dependsOn, options } = q.revealedBy!;
      const checked = options.map((o) => `input[name="q:${dependsOn}"][value="${o}"]:checked`).join(", ");
      return `@supports selector(:has(*)) { form:not(:has(${checked})) [data-question="${q.code}"] { display: none; } }`;
    })
    .join("\n");

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <form action={saveDetailedAnswers} className={styles.screen}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            {t.lead}
          </p>
          {erreur && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}
          {revealRules && <style>{revealRules}</style>}
          {questions.map((question) => (
            <fieldset key={question.code} className={styles.group} data-question={question.code}>
              <legend>
                {frenchSpaces(question.label)}
                {question.revealedBy && (
                  <>
                    {" "}
                    <span className={`muted ${styles.revealHint}`}>
                      {fill(t.revealHint, { answer: revealLabels(question.revealedBy) })}
                    </span>
                  </>
                )}
              </legend>
              <div
                className={
                  // Long answers (a sentence) read better one per row, at full width.
                  question.options.some((o) => o.label.length > LONG_ANSWER)
                    ? `${styles.choices} ${styles.choicesLong}`
                    : styles.choices
                }
              >
                {question.options.map((option) => (
                  <label key={option.code} className={styles.period}>
                    <input
                      type="radio"
                      name={`q:${question.code}`}
                      value={option.code}
                      defaultChecked={question.chosen === option.code}
                    />
                    <span>{frenchSpaces(option.label)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className={styles.actions}>
            <button type="submit" className="btn">
              {t.submit}
            </button>
          </div>
          <BackLink href={`/donner/${feedbackId}/precisions`} label={common.previous} />
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}
