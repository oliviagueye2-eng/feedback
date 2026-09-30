import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { frenchSpaces } from "../../../_feedback/typography";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 2b (topics and free text). TODO: to be built; for now, shows the
 * answer given, with "Modifier", as at the top of the 2b mock-up.
 */
export default async function DetailsPage({ params }: PageProps<"/donner/[feedbackId]/precisions">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getEssentialScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, question } = screen;
  const answer = question.options.find((o) => o.code === context.essentialOption);

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={styles.screen}>
          <div className={styles.answered}>
            <span>
              <span className="muted">{frenchSpaces(question.label)}</span>
              <strong>{answer?.label ?? "Pas encore de réponse"}</strong>
            </span>
            <Link href={`/donner/${feedbackId}`}>Modifier</Link>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            La suite (ce qui vous a plu ou non, et votre commentaire) sera ajoutée à la prochaine étape.
          </p>
        </div>
      </main>
    </>
  );
}
