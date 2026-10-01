import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { COMMENT_MAX_LENGTH, getDetailsScreen, OTHER_TOPIC_CODE, OTHER_TOPIC_MAX_LENGTH } from "@/src/domain/feedback";
import { saveDetails } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { TopicRatings } from "../../../_feedback/TopicRatings";
import { getDictionary } from "../../../../_i18n";
import { frenchSpaces } from "../../../../_i18n/typography";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 2b: for each topic of the feedback's sector, « Bien » or « Pas bien »
 * (option D; « Autre » with a short text), then an optional free text.
 * Everything is optional: « Continuer » with nothing touched is
 * fine. Coming back shows what was already touched and written.
 */
export default async function DetailsPage({ params, searchParams }: PageProps<"/donner/[feedbackId]/precisions">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  let screen;
  try {
    screen = await getDetailsScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, question, answer, topics, comment } = screen;
  // Reached without answering the essential question: back to it.
  if (!answer) redirect(`/donner/${feedbackId}`);
  const { common, details: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <form action={saveDetails} className={styles.screen}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <input type="hidden" name="promptOption" value={answer.code} />

          <div className={styles.answered}>
            <span>
              <span className="muted">{frenchSpaces(question)}</span>
              <strong>{answer.label}</strong>
            </span>
            <Link href={`/donner/${feedbackId}`} className={styles.change}>
              {t.change}
            </Link>
          </div>

          {erreur && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}

          <fieldset className={styles.topics}>
            <legend className={styles.question}>
              {t.topicsTitle} <span className="muted">{t.topicsHint}</span>
            </legend>
            <TopicRatings
              topics={topics}
              otherCode={OTHER_TOPIC_CODE}
              otherMaxLength={OTHER_TOPIC_MAX_LENGTH}
              t={{ good: t.good, bad: t.bad, otherLabel: t.otherLabel, otherPlaceholder: t.otherPlaceholder }}
            />
          </fieldset>

          <div className={styles.group}>
            <label htmlFor="comment">
              {t.commentLabel} <span className="muted">{common.optional}</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              className={styles.comment}
              rows={4}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder={t.commentPlaceholder}
              defaultValue={comment ?? ""}
              aria-describedby="comment-help"
            />
            <span id="comment-help" className={`muted ${styles.commentHelp}`}>
              {t.commentHelp}
            </span>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn">
              {t.submit}
            </button>
          </div>
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}
