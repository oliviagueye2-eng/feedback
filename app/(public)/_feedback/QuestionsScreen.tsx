import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../_components/BackLink";
import { PendingLoader } from "../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { getQuestionnaireScreen, nextQuestionPage, recordPageShown, type QuestionPage } from "@/src/domain/feedback";
import { getDictionary } from "../../_i18n";
import { fill } from "../../_i18n/format";
import { frenchSpaces } from "../../_i18n/typography";
import { saveDetailedAnswers } from "./actions";
import { FeedbackHeader } from "./FeedbackHeader";
import { Progress } from "./Progress";
import { questionPageHref } from "./links";
import styles from "./screen.module.css";

/** Over this many characters, an answer is a sentence: one per row. */
export const LONG_ANSWER = 24;

/**
 * Screen 6 (the questions of the feedback's service or sector) and screen 6b
 * (the common questions, only for the users not satisfied, on their own page):
 * all the page's questions at once, each one optional (not answering is how
 * to skip it). « Continuer » saves what was answered, then the next page, or
 * screen 7 once the feedback is complete. Real radio buttons: works without
 * JavaScript.
 */
export async function QuestionsScreen({
  feedbackId,
  page,
  error,
}: {
  feedbackId: string;
  page: QuestionPage;
  /** Back from the server with an error (?erreur). */
  error: boolean;
}) {
  let screen;
  try {
    screen = await getQuestionnaireScreen(feedbackId, page);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, questions, previous } = screen;
  // Reached without answering the essential question: back to it.
  if (!context.essentialOption) redirect(`/donner/${feedbackId}`);
  // Nothing to ask on this page (anymore): the next page with questions, else screen 2b ends it.
  if (questions.length === 0) {
    const next = await nextQuestionPage(feedbackId, page);
    redirect(next ? questionPageHref(feedbackId, next) : `/donner/${feedbackId}/precisions`);
  }
  await recordPageShown(feedbackId, page);
  const previousHref =
    previous === "sector" ? questionPageHref(feedbackId, "sector") : `/donner/${feedbackId}/precisions`;
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
          <Progress screen={page} />
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <input type="hidden" name="page" value={page} />
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            {t.lead}
          </p>
          {error && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}
          {revealRules && <style>{revealRules}</style>}
          {questions.map((question) => (
            <fieldset key={question.code} className={`${styles.group} ${styles.questionBlock}`} data-question={question.code}>
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
          <BackLink href={previousHref} label={common.previous} />
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}
