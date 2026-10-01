import { notFound, redirect } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { getDictionary } from "../../../../_i18n";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import styles from "../../../_feedback/screen.module.css";

/** Screen 7: thanks, once the feedback is complete. Nothing more to do. */
export default async function ThanksPage({ params }: PageProps<"/donner/[feedbackId]/merci">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getEssentialScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context } = screen;
  // Not finished yet: back to screen 2b (which goes back to screen 2 if needed).
  if (!context.completed) redirect(`/donner/${feedbackId}/precisions`);
  const { thanks: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={`${styles.screen} ${styles.thanks}`}>
          <span className={styles.thanksCheck}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h1 className={styles.title}>{t.title}</h1>
          <p>{t.text}</p>
          <p className={`muted ${styles.thanksClose}`}>{t.close}</p>
        </div>
      </main>
    </>
  );
}
