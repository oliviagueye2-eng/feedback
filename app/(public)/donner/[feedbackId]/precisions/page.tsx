import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { COMMENT_MAX_LENGTH, getDetailsScreen, OTHER_TOPIC_CODE, OTHER_TOPIC_MAX_LENGTH } from "@/src/domain/feedback";
import { saveDetails } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { SATISFACTION_LEVEL, SatisfactionFace } from "../../../_feedback/SatisfactionFace";
import { TopicRatings } from "../../../_feedback/TopicRatings";
import { getDictionary } from "../../../../_i18n";
import { frenchSpaces } from "../../../../_i18n/typography";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 2b: for each topic of the feedback's sector, « Bien », « Pas bien » or
 * « Non concerné » (option D; « Autre » with a short text), some topics behind
 * a yes/no question (« Avez-vous payé quelque chose ? »), then an optional
 * free text.
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
  const level = SATISFACTION_LEVEL[answer.code];

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <form action={saveDetails} className={styles.screen}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <input type="hidden" name="promptOption" value={answer.code} />

          {/* The answer to screen 2, in its level's colours so it reads at a
              glance; the question is a small reminder above it. */}
          <div className={styles.answered} style={level ? satisfactionColours(level) : undefined}>
            <span className={styles.answeredQuestion}>{frenchSpaces(question)}</span>
            <div className={styles.answeredLevel}>
              {level && <SatisfactionFace level={level} className={styles.answeredFace} />}
              <strong>{answer.label}</strong>
              <Link href={`/donner/${feedbackId}`} className={styles.answeredChange}>
                {t.change}
              </Link>
            </div>
          </div>

          {erreur && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}

          <fieldset className={styles.topics}>
            <legend className={styles.question}>
              {t.topicsTitle}
            </legend>
            <div className={styles.topicSheet}>
              <TopicRatings
                topics={topics}
                otherCode={OTHER_TOPIC_CODE}
                otherMaxLength={OTHER_TOPIC_MAX_LENGTH}
                t={{
                  good: t.good,
                  bad: t.bad,
                  notConcerned: t.notConcerned,
                  otherLabel: t.otherLabel,
                  otherPlaceholder: t.otherPlaceholder,
                }}
              />
            </div>
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
          <BackLink href={`/donner/${feedbackId}`} label={common.previous} />
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}

/** The level's tint as the block's background, its colour for the edge. */
function satisfactionColours(level: 1 | 2 | 3 | 4 | 5) {
  return {
    "--answer": `var(--satisfaction-${level})`,
    "--answer-tint": `var(--satisfaction-${level}-tint)`,
  } as React.CSSProperties;
}
