import { notFound } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { getDictionary } from "../../../../_i18n";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screens 4-5 (confirmation, then « Terminer » or « Continuer »). TODO: to be
 * built; for now, only confirms that the feedback is saved.
 */
export default async function SavedPage({ params }: PageProps<"/donner/[feedbackId]/enregistre">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getEssentialScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context } = screen;
  const { saved: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={styles.screen}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.next}
          </p>
        </div>
      </main>
    </>
  );
}
