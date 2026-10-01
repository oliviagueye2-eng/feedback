import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { getSavedScreen } from "@/src/domain/feedback";
import { getDictionary } from "../../../../_i18n";
import { plural } from "../../../../_i18n/format";
import { finishFeedback } from "../../../_feedback/actions";
import { CheckIcon } from "../../../_feedback/CheckIcon";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screens 4-5, on the same page: the feedback is saved, then « Continuer le
 * questionnaire » or « Terminer ». The detailed questionnaire is offered only
 * when one is published for this feedback.
 */
export default async function SavedPage({ params }: PageProps<"/donner/[feedbackId]/enregistre">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getSavedScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, questionCount } = screen;
  // Reached without answering the essential question: back to it.
  if (!context.essentialOption) redirect(`/donner/${feedbackId}`);
  const { common, saved: t } = await getDictionary();
  // About 25 seconds per question.
  const minutes = Math.max(1, Math.ceil(questionCount * 0.4));

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={styles.savedBanner} role="status">
          <div className={styles.savedBannerInner}>
            <span className={styles.savedCheck}>
              <CheckIcon />
            </span>
            <span>
              <strong>{t.title}</strong>
              <span>{t.counts}</span>
            </span>
          </div>
        </div>
        <form action={finishFeedback} className={styles.screen}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          {questionCount > 0 && (
            <div className={styles.more}>
              <h2>{t.moreTitle}</h2>
              <p>{plural(t.moreQuestions, questionCount)}</p>
              <span className="muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {plural(t.moreDuration, minutes)}
              </span>
            </div>
          )}
          <div className={styles.actions}>
            {questionCount > 0 && (
              <Link href={`/donner/${feedbackId}/questionnaire`} className="btn">
                {t.continue}
              </Link>
            )}
            <button type="submit" className={questionCount > 0 ? `btn ${styles.btnSecondary}` : "btn"}>
              {t.finish}
            </button>
          </div>
          <BackLink href={`/donner/${feedbackId}/precisions`} label={common.previous} />
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}
