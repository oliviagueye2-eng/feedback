import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { getQuestionnaireScreen } from "@/src/domain/feedback";
import { saveDetailedAnswers } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { getDictionary } from "../../../../_i18n";
import { frenchSpaces } from "../../../../_i18n/typography";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 6: the detailed questionnaire of the feedback's service or sector, all
 * questions on one page, each one optional (not answering is how to skip it).
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
          {questions.map((question) => (
            <fieldset key={question.code} className={styles.group}>
              <legend>{frenchSpaces(question.label)}</legend>
              <div className={styles.choices}>
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
