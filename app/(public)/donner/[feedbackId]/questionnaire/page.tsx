import { notFound } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { BackLink } from "../../../../_components/BackLink";
import { getDictionary } from "../../../../_i18n";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 6 (detailed questionnaire). TODO: to be built once a questionnaire is
 * written; screens 4-5 link here only when one is published.
 */
export default async function QuestionnairePage({ params }: PageProps<"/donner/[feedbackId]/questionnaire">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getEssentialScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context } = screen;
  const { common, questionnaire: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={styles.screen}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.next}
          </p>
          <BackLink href={`/donner/${feedbackId}/enregistre`} label={common.previous} />
        </div>
      </main>
    </>
  );
}
