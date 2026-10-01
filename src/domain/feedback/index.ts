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
import { selectDetailedQuestionnaire } from "../questionnaire/select";
import { VISIT_PERIODS, type Channel, type VisitPeriod } from "../types";
import { computeVisitMonth, defaultVisitPeriod } from "./visit";

export const COMMENT_MAX_LENGTH = 500;
export const OTHER_TOPIC_MAX_LENGTH = 50;
export const OTHER_TOPIC_CODE = "OTHER";
export const TOPIC_SENTIMENTS = ["positive", "negative"] as const;
const CHANNELS: readonly Channel[] = ["qr", "search", "link"];

/** Screen 1: creates the feedback, or updates it when the phone sends it again. */
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
  const sources = await db.findQuestionnaireSources(feedbackId);
  if (!sources) throw notFound("Feedback not found");
  await db.upsertAnswer({
    feedbackId,
    questionCode,
    optionCode,
    textValue,
    detailed: selectDetailedQuestionnaire(sources),
  });
}

/**
 * Screen 2b: the topics touched, each « Bien » (positive) or « Pas bien »
 * (negative). "Autre" may carry a short text naming the topic.
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
 * After screen 2b: how many questions the detailed questionnaire has
 * (0: none published yet, the feedback ends there).
 */
export async function countDetailedQuestions(feedbackId: string): Promise<number> {
  requireUuid(feedbackId, "id");
  const sources = await db.findQuestionnaireSources(feedbackId);
  if (!sources) throw notFound("Feedback not found");
  return db.countQuestions(selectDetailedQuestionnaire(sources));
}

/**
 * Screen 6: the feedback's context and the questions of its detailed
 * questionnaire, with what was already answered (none: nothing to show).
 */
export async function getQuestionnaireScreen(feedbackId: string) {
  const { context } = await getEssentialScreen(feedbackId);
  const sources = await db.findQuestionnaireSources(feedbackId);
  if (!sources) throw notFound("Feedback not found");
  const questions = await db.findDetailedQuestions(feedbackId, selectDetailedQuestionnaire(sources));
  return { context, questions };
}

/**
 * Screen 6 → screen 7: the answers given (question code → option code), all
 * optional, then the feedback is complete. A question not answered keeps the
 * answer given before, if any.
 */
export async function saveQuestionnaire(feedbackId: string, answers: Record<string, string>): Promise<void> {
  for (const [questionCode, option] of Object.entries(answers)) {
    await saveAnswer(feedbackId, questionCode, { option });
  }
  await completeFeedback(feedbackId);
}

/** End of the feedback (screen 7 follows): only once the essential question is answered. */
export async function completeFeedback(feedbackId: string): Promise<void> {
  requireUuid(feedbackId, "id");
  if (!(await db.completeFeedback(feedbackId))) {
    throw notFound("Feedback not found or essential question not answered");
  }
}

/** Screen 6: which detailed questionnaire to show for this feedback. */
export async function getDetailedQuestionnaire(feedbackId: string) {
  requireUuid(feedbackId, "id");
  const sources = await db.findQuestionnaireSources(feedbackId);
  if (!sources) throw notFound("Feedback not found");
  return selectDetailedQuestionnaire(sources);
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
