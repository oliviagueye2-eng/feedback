import { notFound, redirect } from "next/navigation";
import { BackLink } from "../../../../_components/BackLink";
import { FormValidation } from "../../../../_components/FormValidation";
import { PendingLoader } from "../../../../_components/PendingLoader";
import { DomainError } from "@/src/domain/errors";
import { CONTACT_MAX_LENGTH, getSendScreen, recordPageShown } from "@/src/domain/feedback";
import { getDictionary } from "../../../../_i18n";
import { sendFeedback } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { Progress } from "../../../_feedback/Progress";
import { questionPageHref } from "../../../_feedback/links";
import styles from "../../../_feedback/screen.module.css";

/**
 * Last screen, after all the questions: the e-mail or phone number (one
 * field, required, never published) and the statement on honour (required),
 * then « Envoyer mon avis » completes the feedback and screen 7 follows
 * (decided by Olivia, 2026-10-05: no more anonymous feedbacks, no
 * verification code for now). Works without JavaScript: the browser asks for
 * both fields; the server checks them again.
 */
export default async function SendPage({ params, searchParams }: PageProps<"/donner/[feedbackId]/envoyer">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  let screen;
  try {
    screen = await getSendScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, contact, previous } = screen;
  // Reached without answering the essential question: back to it.
  if (!context.essentialOption) redirect(`/donner/${feedbackId}`);
  // Already sent: nothing more to do here.
  if (context.completed) redirect(`/donner/${feedbackId}/merci`);
  await recordPageShown(feedbackId, "send");
  const previousHref =
    previous === "details" ? `/donner/${feedbackId}/precisions` : questionPageHref(feedbackId, previous);
  const { common, send: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <form action={sendFeedback} className={`${styles.screen} ${styles.send}`}>
          <Progress screen="send" />
          <input type="hidden" name="feedbackId" value={feedbackId} />
          {erreur !== undefined && (
            <p role="alert" className={styles.error}>
              {t.error}
            </p>
          )}
          <div className={styles.group}>
            <label htmlFor="contact">{t.contactLabel}</label>
            <FormValidation message={t.contactError} names={["contact"]} />
            <input
              id="contact"
              name="contact"
              className={styles.contact}
              required
              maxLength={CONTACT_MAX_LENGTH}
              placeholder={t.contactPlaceholder}
              defaultValue={contact?.value ?? ""}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="contact-help"
            />
            <span id="contact-help" className={`muted ${styles.commentHelp}`}>
              {t.contactHelp}
            </span>
          </div>
          <div className={styles.group}>
            <FormValidation message={t.attestError} names={["attested"]} />
            <label className={styles.attest}>
              <input type="checkbox" name="attested" value="yes" required />
              <span>{t.attest}</span>
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className="btn">
              {t.submit}
            </button>
          </div>
          <BackLink href={previousHref} label={common.previous} />
          <PendingLoader message={common.wait} />
        </form>
      </main>
    </>
  );
}
