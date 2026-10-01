import type { FeedbackContext } from "@/src/db/feedbacks";
import type { QuestionPage } from "@/src/domain/feedback";

/**
 * Screen 1 of a feedback already started, to change the reason or the period
 * (« Précédent » from screen 2): by its QR code when it came from one, else by
 * the establishment. ?avis= makes screen 1 update this feedback.
 */
export const screenOneHref = (context: FeedbackContext, feedbackId: string) =>
  context.channel === "qr" && context.qrCode
    ? `/e/${encodeURIComponent(context.qrCode)}?avis=${feedbackId}`
    : `/avis/${context.establishmentId}?avis=${feedbackId}`;

/** Screen 6 (the sector's questions) or 6b (the common questions). */
export const questionPageHref = (feedbackId: string, page: QuestionPage) =>
  page === "sector" ? `/donner/${feedbackId}/questionnaire` : `/donner/${feedbackId}/questionnaire/commun`;
