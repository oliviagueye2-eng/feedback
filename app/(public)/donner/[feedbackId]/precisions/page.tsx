import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { COMMENT_MAX_LENGTH, getDetailsScreen, OTHER_TOPIC_CODE, OTHER_TOPIC_MAX_LENGTH } from "@/src/domain/feedback";
import { saveDetails } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { frenchSpaces } from "../../../_feedback/typography";
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
            <Link href={`/donner/${feedbackId}`}>Modifier</Link>
          </div>

          {erreur && (
            <p role="alert" className={styles.error}>
              Votre avis n&apos;a pas pu être enregistré. Vérifiez vos réponses, puis réessayez.
            </p>
          )}

          <fieldset className={styles.topics}>
            <legend className={styles.question}>
              {liked ? "Ce qui vous a plu" : "Ce qui n'a pas été"}{" "}
              <span className="muted">(plusieurs choix possibles)</span>
            </legend>
            {topics.map((t) =>
              t.code === OTHER_TOPIC_CODE ? (
                <div key={t.code} className={styles.other}>
                  <label className={styles.topic}>
                    <input type="checkbox" name="topic" value={t.code} defaultChecked={t.checked} />
                    <span>{t.label}</span>
                  </label>
                  <input
                    name="otherText"
                    className={styles.otherField}
                    aria-label="Précisez"
                    placeholder="Précisez (ex. : parking)"
                    maxLength={OTHER_TOPIC_MAX_LENGTH}
                    defaultValue={t.otherText ?? ""}
                    autoComplete="off"
                  />
                </div>
              ) : (
                <label key={t.code} className={styles.topic}>
                  <input type="checkbox" name="topic" value={t.code} defaultChecked={t.checked} />
                  <span>{t.label}</span>
                </label>
              ),
            )}
          </fieldset>

          <div className={styles.group}>
            <label htmlFor="comment">
              {frenchSpaces(answer.followUpPrompt ?? "Votre commentaire")}{" "}
              <span className="muted">(facultatif)</span>
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
              N&apos;indiquez ni nom ni numéro de téléphone.
            </span>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn">
              Enregistrer mon avis
            </button>
          </div>
          <PendingLoader message="Enregistrement de votre avis…" />
        </form>
      </main>
    </>
  );
}
