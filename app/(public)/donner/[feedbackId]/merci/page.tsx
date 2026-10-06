import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { getDictionary } from "../../../../_i18n";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { sendPageHref } from "../../../_feedback/links";
import styles from "../../../_feedback/screen.module.css";

/**
 * Screen 7: thanks, once the feedback is complete, on the home page's queue
 * ticket stamped « Merci » with the day's date. Nothing more to do.
 */
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
  // Not sent yet: back to the last screen (which goes back to screen 2 if needed).
  if (!context.completed) redirect(sendPageHref(feedbackId));
  const { common, home, thanks: t } = await getDictionary();
  // The day's date on the stamp, in Dakar.
  const today = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Dakar", dateStyle: "short" }).format(new Date());

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={`${styles.screen} ${styles.thanks}`}>
          <div className={styles.thanksTicket}>
            <div className={styles.thanksMain}>
              <span className={styles.thanksWatermark} aria-hidden="true" />
              <div className={`muted ${styles.thanksHead}`}>
                <span>{home.ticketLabel}</span>
                <strong>{home.ticketNumber}</strong>
              </div>
              <h1>{t.title}</h1>
              <p>{t.text}</p>
            </div>
            <div className={styles.thanksTear} aria-hidden="true" />
            <p className={`muted ${styles.thanksStub}`}>{t.nextPublication}</p>
            {/* Decorative: the title already says it. */}
            <div className={styles.stamp} aria-hidden="true">
              <strong>{t.stamp}</strong>
              <span>{today}</span>
            </div>
          </div>
          <Link href={`/resultats/${context.establishmentId}?avis=envoye`} className={styles.thanksResults}>
            {t.seeResults}
          </Link>
          <BackLink href="/" label={common.backHome} />
        </div>
      </main>
    </>
  );
}
