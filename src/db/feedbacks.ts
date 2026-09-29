/**
 * Data access for collection tables (feedback, answer, feedback_topic, comment).
 * Every write is an upsert keyed on ids chosen by the phone, so that a request
 * sent twice after a network cut gives the same result.
 */
import { notImplemented } from "../domain/errors";
import type { Channel, VisitPeriod } from "../domain/types";

export interface FeedbackRow {
  id: string;
  establishmentId: string;
  serviceId: number | null;
  qrCodeId: string | null;
  channel: Channel;
  language: string;
  visitPeriod: VisitPeriod | null;
  visitMonth: string | null;
  startedAt: Date;
}

export async function upsertFeedback(row: FeedbackRow): Promise<void> {
  void row;
  throw notImplemented("db.upsertFeedback");
}

export async function upsertAnswer(input: {
  feedbackId: string;
  questionCode: string;
  optionCode: string | null;
  textValue: string | null;
}): Promise<void> {
  void input;
  throw notImplemented("db.upsertAnswer");
}

/** Replaces all topics of a feedback. */
export async function replaceTopics(input: {
  feedbackId: string;
  topics: { code: string; otherText: string | null }[];
}): Promise<void> {
  void input;
  throw notImplemented("db.replaceTopics");
}

export async function upsertComment(input: {
  feedbackId: string;
  text: string;
  promptOptionCode: string;
}): Promise<void> {
  void input;
  throw notImplemented("db.upsertComment");
}

/** Where to find the detailed questionnaire: the feedback's service, else its sector. */
export async function findQuestionnaireSources(feedbackId: string): Promise<{
  serviceQuestionnaireId: number | null;
  sectorFallbackQuestionnaireId: number | null;
} | null> {
  void feedbackId;
  throw notImplemented("db.findQuestionnaireSources");
}
