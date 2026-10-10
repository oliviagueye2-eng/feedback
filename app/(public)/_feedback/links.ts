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

/** Last screen: the e-mail or phone number and the statement on honour, then « Envoyer mon avis ». */
export const sendPageHref = (feedbackId: string) => `/donner/${feedbackId}/envoyer`;

/** « Dans quelle agence ? », between screen 1 and screen 2 when the service is done in an agency. */
export const siteStepHref = (feedbackId: string) => `/donner/${feedbackId}/agence`;

/** « Précédent » from screen 2: the agency step when there is one, else screen 1. */
export const beforeScreenTwoHref = (context: FeedbackContext, feedbackId: string) =>
  context.asksSite ? siteStepHref(feedbackId) : screenOneHref(context, feedbackId);
