import * as db from "../../db/feedbacks";
import {
  asObject,
  isUuid,
  optionalInteger,
  optionalString,
  requireOneOf,
  requireString,
  requireUuid,
} from "../../lib/validation";
import { invalidInput, notFound } from "../errors";
import { questionsNotApplicable, questionsToShow } from "../questionnaire/conditions";
import { selectQuestionSets } from "../questionnaire/select";
import { VISIT_PERIODS, type Channel, type VisitPeriod } from "../types";
import { parseContact } from "./contact";
import { computeVisitMonth, defaultVisitPeriod } from "./visit";

export { CONTACT_MAX_LENGTH } from "./contact";
export const COMMENT_MAX_LENGTH = 500;
export const OTHER_TOPIC_MAX_LENGTH = 50;
export const OTHER_TOPIC_CODE = "OTHER";
export const TOPIC_SENTIMENTS = ["positive", "negative", "not_concerned"] as const;
const CHANNELS: readonly Channel[] = ["qr", "search", "link"];

/**
 * Screen 1: creates the feedback, or updates it when the phone sends it again
 * (the answer to the essential question is then cleared).
 */
export async function upsertFeedback(
  id: string,
  body: unknown,
  now: Date = new Date(),
): Promise<void> {
  requireUuid(id, "id");
  const input = asObject(body);
  const channel = requireOneOf(input, "channel", CHANNELS);
  const visitPeriod: VisitPeriod | null =
    input.visitPeriod === undefined || input.visitPeriod === null
      ? defaultVisitPeriod(channel)
      : requireOneOf(input, "visitPeriod", VISIT_PERIODS);
  // Screen 1 asks "Quand êtes-vous venu(e) ?" to everyone who did not scan a QR code.
  if (visitPeriod === null) throw invalidInput("visitPeriod is required unless channel is qr");

  // started_at is rounded to the hour to limit re-identification.
  const startedAt = new Date(now);
  startedAt.setUTCMinutes(0, 0, 0);

  await db.upsertFeedback({
    id,
    establishmentId: requireUuid(requireString(input, "establishmentId"), "establishmentId"),
    serviceId: optionalInteger(input, "serviceId"),
    qrCodeId: optionalString(input, "qrCodeId", { max: 64 }),
    channel,
    language: requireString(input, "language", { min: 2, max: 8 }),
    visitPeriod,
    visitMonth: visitPeriod ? computeVisitMonth(visitPeriod, now) : null,
    startedAt,
  });
  // Back on screen 1 the visit may have changed: the satisfaction is asked again.
  await db.clearEssentialAnswer(id);
}

/** Screens 2 and 6: one answer, saved as soon as it is given. */
export async function saveAnswer(
  feedbackId: string,
  questionCode: string,
  body: unknown,
): Promise<void> {
  requireUuid(feedbackId, "id");
  const input = asObject(body);
  const optionCode = optionalString(input, "option", { max: 64 });
  const textValue = optionalString(input, "text", { max: COMMENT_MAX_LENGTH });
  if (!optionCode && !textValue) throw invalidInput("option or text is required");
  const sources = await db.findQuestionSetSources(feedbackId);
  if (!sources) throw notFound("Feedback not found");
  await db.upsertAnswer({
    feedbackId,
    questionCode,
    optionCode,
    textValue,
    setIds: selectQuestionSets(sources),
  });
}

/**
 * Screen 2b: the topics touched, each « Bien » (positive), « Pas bien »
 * (negative) or « Non concerné » (not_concerned, never counted in the
 * results). "Autre" may carry a short text naming the topic. A topic shown
 * only after an answer (« Frais payés » after « Oui » to « Avez-vous payé
 * quelque chose ? ») is ignored without it: save the answers first
 * (saveTopicGates).
 */
export async function saveTopics(feedbackId: string, body: unknown): Promise<void> {
  requireUuid(feedbackId, "id");
  const input = asObject(body);
  if (!Array.isArray(input.topics)) throw invalidInput("topics must be an array");
  const topics = input.topics.map((raw) => {
    const topic = asObject(raw);
    const code = requireString(topic, "code", { max: 64 });
    const sentiment = requireOneOf(topic, "sentiment", TOPIC_SENTIMENTS);
    const otherText = optionalString(topic, "otherText", { max: OTHER_TOPIC_MAX_LENGTH });
    if (otherText && code !== OTHER_TOPIC_CODE) {
      throw invalidInput("otherText is only allowed for the OTHER topic");
    }
    return { code, sentiment, otherText };
  });
  if (new Set(topics.map((t) => t.code)).size !== topics.length) {
    throw invalidInput("Each topic can be given only once");
  }
  await db.replaceTopics({ feedbackId, topics });
}

/**
 * Screen 2b: the answers to the yes/no questions asked in the place of a topic
 * (question code → option code). A question of the screen left without an
 * answer is cleared (touched again); a question the screen does not ask is
 * refused.
 */
export async function saveTopicGates(feedbackId: string, answers: Record<string, string>): Promise<void> {
  requireUuid(feedbackId, "id");
  const codes = await db.findTopicGateCodes(feedbackId);
  if (Object.keys(answers).some((code) => !codes.includes(code))) {
    throw invalidInput("Unknown question for screen 2b");
  }
  for (const code of codes) {
    const option = answers[code];
    if (option) await saveAnswer(feedbackId, code, { option });
    else await db.deleteAnswerByCode(feedbackId, code);
  }
}

/** Screen 2b: free text. promptOption is the essential answer given when it was written. */
export async function saveComment(feedbackId: string, body: unknown): Promise<void> {
  requireUuid(feedbackId, "id");
  const input = asObject(body);
  await db.upsertComment({
    feedbackId,
    text: requireString(input, "text", { max: COMMENT_MAX_LENGTH }),
    promptOptionCode: requireString(input, "promptOption", { max: 64 }),
  });
}

/** Screen 2b: the user emptied the free text. */
export async function removeComment(feedbackId: string): Promise<void> {
  requireUuid(feedbackId, "id");
  await db.deleteComment(feedbackId);
}

/**
 * Screen 2b: the answer given, the topics of the feedback's sector, and what
 * the user already touched or wrote.
 */
export async function getDetailsScreen(feedbackId: string) {
  const { context, question } = await getEssentialScreen(feedbackId);
  const [topics, comment] = await Promise.all([
    db.findTopicChoices(feedbackId),
    db.findCommentText(feedbackId),
  ]);
  const answer = question.options.find((o) => o.code === context.essentialOption) ?? null;
  return {
    context,
    question: question.label,
    answer,
    topics,
    comment,
  };
}

/**
 * The questions of screen 6 for this feedback (detailed questionnaire, then
 * the common ones), its answers by question code, essential answer included,
 * and the questions screen 2b already asked (askedBefore: never asked again).
 */
async function loadPageQuestions(feedbackId: string) {
  const [{ context }, sources, askedBefore] = await Promise.all([
    getEssentialScreen(feedbackId),
    db.findQuestionSetSources(feedbackId),
    db.findTopicGateCodes(feedbackId),
  ]);
  if (!sources) throw notFound("Feedback not found");
  const questions = await db.findDetailedQuestions(feedbackId, selectQuestionSets(sources));
  const answers: Record<string, string | null> = {
    OVERALL_SATISFACTION: context.essentialOption,
    ...Object.fromEntries(questions.map((q) => [q.code, q.chosen])),
  };
  return { context, questions, answers, askedBefore };
}

/**
 * The pages of questions after screen 2b: the questions of the sector, type
 * and service (screen 6), then the common ones on their own page (screen 6b),
 * so that « cette situation » is not read as the previous question's subject.
 */
export type QuestionPage = "sector" | "common";
const QUESTION_PAGES: QuestionPage[] = ["sector", "common"];

/**
 * The questions a page shows for this feedback (the common ones only to the
 * users not satisfied). Those screen 2b already asked are left out; their
 * answers still show or hide the others.
 */
const shownOn = (
  page: QuestionPage,
  { questions, answers, askedBefore }: Awaited<ReturnType<typeof loadPageQuestions>>,
) =>
  questionsToShow(
    questions.filter((q) => q.common === (page === "common") && !askedBefore.includes(q.code)),
    answers,
  );

/**
 * The page of questions that comes after screen 2b ("details") or after a
 * page of questions: the next one with questions to show, or null (the
 * feedback ends there).
 */
export async function nextQuestionPage(
  feedbackId: string,
  after: "details" | QuestionPage,
): Promise<QuestionPage | null> {
  requireUuid(feedbackId, "id");
  const loaded = await loadPageQuestions(feedbackId);
  const candidates = after === "details" ? QUESTION_PAGES : QUESTION_PAGES.slice(QUESTION_PAGES.indexOf(after) + 1);
  return candidates.find((page) => shownOn(page, loaded).length > 0) ?? null;
}

/**
 * Screens 6 and 6b: the feedback's context and the questions to show on the
 * page, with what was already answered. A question that depends on an
 * earlier one of the page says which answer reveals it (revealedBy).
 * previous: the page « Précédent » leads to (screen 2b, or screen 6).
 */
export async function getQuestionnaireScreen(feedbackId: string, page: QuestionPage) {
  requireUuid(feedbackId, "id");
  const loaded = await loadPageQuestions(feedbackId);
  const previous =
    page === "common" && shownOn("sector", loaded).length > 0 ? ("sector" as const) : ("details" as const);
  return { context: loaded.context, questions: shownOn(page, loaded), previous };
}

/**
 * Screen 6 or 6b → the next page of questions, or the last screen (« Envoyer
 * mon avis »): the answers given (question code → option code), all optional.
 * A question not answered keeps the answer given before, if any. Returns the
 * next page, or null when the questions are over.
 */
export async function saveQuestionnaire(
  feedbackId: string,
  page: QuestionPage,
  answers: Record<string, string>,
): Promise<QuestionPage | null> {
  for (const [questionCode, option] of Object.entries(answers)) {
    await saveAnswer(feedbackId, questionCode, { option });
  }
  return nextQuestionPage(feedbackId, page);
}

/**
 * The page now shown to the user (screen 2b « details », a page of questions,
 * or the last screen « send »), recorded while the feedback is not sent: for
 * a feedback never sent, the last one is the page left without submitting
 * (back-office, « Abandons par étape »).
 */
export async function recordPageShown(feedbackId: string, page: "details" | QuestionPage | "send"): Promise<void> {
  requireUuid(feedbackId, "id");
  await db.setLastPage(feedbackId, page);
}

/**
 * Last screen (« Envoyer mon avis »): the feedback's context, the contact
 * already given, and the page « Précédent » leads to (the last page of
 * questions shown, else screen 2b).
 */
export async function getSendScreen(feedbackId: string) {
  requireUuid(feedbackId, "id");
  const loaded = await loadPageQuestions(feedbackId);
  const previous: QuestionPage | "details" =
    [...QUESTION_PAGES].reverse().find((page) => shownOn(page, loaded).length > 0) ?? "details";
  return { context: loaded.context, contact: await db.findFeedbackContact(feedbackId), previous };
}

/**
 * Last screen → screen 7: the e-mail or phone number (required) and the
 * statement on honour (required), then the feedback is complete. Only once
 * the essential question is answered.
 */
export async function submitFeedback(feedbackId: string, input: { contact: string; attested: boolean }) {
  requireUuid(feedbackId, "id");
  if (!input.attested) throw invalidInput("the statement on honour is required");
  const contact = parseContact(input.contact);
  const context = await db.findFeedbackContext(feedbackId);
  if (!context?.essentialOption) throw notFound("Feedback not found or essential question not answered");
  await db.saveFeedbackContact(feedbackId, contact);
  await completeFeedback(feedbackId);
}

/**
 * End of the feedback (screen 7 follows), from the last screen: only once the essential question is
 * answered. The answers that no longer apply are removed first (e.g. « Avez-
 * vous signalé ce problème ? » answered, then the user became satisfied).
 */
export async function completeFeedback(feedbackId: string): Promise<void> {
  requireUuid(feedbackId, "id");
  const { questions, answers } = await loadPageQuestions(feedbackId);
  const stale = questionsNotApplicable(questions, answers).filter((q) => q.chosen !== null);
  await db.deleteAnswers(feedbackId, stale.map((q) => q.id));
  if (!(await db.completeFeedback(feedbackId))) {
    throw notFound("Feedback not found or essential question not answered");
  }
}

/**
 * Screens 6 and 6b for an app: the questions this feedback may be asked after
 * screen 2b (lists of its sector, type and service, then the common ones),
 * with their answers, conditions and what was already answered; askedBefore:
 * those screen 2b already asks, not to be shown again.
 */
export async function getDetailedQuestionnaire(feedbackId: string) {
  requireUuid(feedbackId, "id");
  const { questions, askedBefore } = await loadPageQuestions(feedbackId);
  return { questions, askedBefore };
}

/**
 * Screen 1 reached again (« Précédent », or a reload: see ResumeFeedback): the
 * feedback to update instead of creating a new one, with the reason and period
 * already chosen. Null when the id is not a feedback of this establishment, or
 * when that feedback is complete (screen 1 then starts a new one).
 */
export async function findFeedbackToResume(feedbackId: string, establishmentId: string) {
  if (!isUuid(feedbackId)) return null;
  const context = await db.findFeedbackContext(feedbackId);
  if (!context || context.establishmentId !== establishmentId || context.completed) return null;
  return { id: feedbackId, serviceId: context.serviceId, visitPeriod: context.visitPeriod };
}

/** Screen 2: the feedback's context and the essential question. */
export async function getEssentialScreen(feedbackId: string) {
  requireUuid(feedbackId, "id");
  const [context, question] = await Promise.all([
    db.findFeedbackContext(feedbackId),
    db.findEssentialQuestion(),
  ]);
  if (!context) throw notFound("Feedback not found");
  if (!question) throw new Error("The essential question is missing from the reference data");
  return { context, question };
}
