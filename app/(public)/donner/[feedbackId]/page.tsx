import { notFound } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getEssentialScreen } from "@/src/domain/feedback";
import { answerEssential } from "../../_feedback/actions";
import { EssentialOptions } from "../../_feedback/EssentialOptions";
import { FeedbackHeader } from "../../_feedback/FeedbackHeader";
import { frenchSpaces } from "../../_feedback/typography";
import styles from "../../_feedback/screen.module.css";

/** Screen 2: the essential question, the same in every sector. */
export default async function EssentialQuestionPage({ params }: PageProps<"/donner/[feedbackId]">) {
  const { feedbackId } = await params;
  let screen;
  try {
    screen = await getEssentialScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { context, question } = screen;

  return (
    <>
      <FeedbackHeader establishmentName={context.establishmentName} serviceLabel={context.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <form action={answerEssential} className={styles.screen}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            Une question, puis c&apos;est enregistré.
          </p>
          <fieldset className={styles.options}>
            <legend className={styles.question}>{frenchSpaces(question.label)}</legend>
            <EssentialOptions options={question.options} chosen={context.essentialOption} />
          </fieldset>
        </form>
      </main>
    </>
  );
}
