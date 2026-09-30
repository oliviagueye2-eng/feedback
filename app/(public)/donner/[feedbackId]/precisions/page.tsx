import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { COMMENT_MAX_LENGTH, getDetailsScreen, OTHER_TOPIC_CODE, OTHER_TOPIC_MAX_LENGTH } from "@/src/domain/feedback";
import { saveDetails } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { getDictionary } from "../../../../_i18n";
import { frenchSpaces } from "../../../../_i18n/typography";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 2b: what went well or not (topics of the feedback's sector, « Autre »
 * with a short text), then an optional free text. Everything is optional:
 * « Enregistrer mon avis » with nothing checked is fine. Coming back shows
 * what was already checked and written.
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
  const { context, question, answer, liked, topics, comment } = screen;
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
            <Link href={`/donner/${feedbackId}`}>{t.change}</Link>
          </div>

          {erreur && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}

          <fieldset className={styles.topics}>
            <legend className={styles.question}>
              {liked ? t.liked : t.notLiked} <span className="muted">{t.severalChoices}</span>
            </legend>
            {topics.map((topic) =>
              topic.code === OTHER_TOPIC_CODE ? (
                <div key={topic.code} className={styles.other}>
                  <label className={styles.topic}>
                    <input type="checkbox" name="topic" value={topic.code} defaultChecked={topic.checked} />
                    <span>{topic.label}</span>
                  </label>
                  <input
                    name="otherText"
                    className={styles.otherField}
                    aria-label={t.otherLabel}
                    placeholder={t.otherPlaceholder}
                    maxLength={OTHER_TOPIC_MAX_LENGTH}
                    defaultValue={topic.otherText ?? ""}
                    autoComplete="off"
                  />
                </div>
              ) : (
                <label key={topic.code} className={styles.topic}>
                  <input type="checkbox" name="topic" value={topic.code} defaultChecked={topic.checked} />
                  <span>{topic.label}</span>
                </label>
              ),
            )}
          </fieldset>

          <div className={styles.group}>
            <label htmlFor="comment">
              {answer.followUpPrompt ? frenchSpaces(answer.followUpPrompt) : t.commentDefault}{" "}
              <span className="muted">{common.optional}</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              className={styles.comment}
              rows={4}
              maxLength={COMMENT_MAX_LENGTH}
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
          <PendingLoader message={common.savingFeedback} />
        </form>
      </main>
    </>
  );
}
