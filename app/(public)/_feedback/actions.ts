"use server";

import { redirect } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { defaultLocale } from "../../_i18n";
import {
  completeFeedback,
  countDetailedQuestions,
  OTHER_TOPIC_CODE,
  removeComment,
  saveAnswer,
  saveComment,
  saveQuestionnaire,
  saveTopics,
  upsertFeedback,
} from "@/src/domain/feedback";

/**
 * Screen 1 → screen 2: records the visit (establishment, reason, when), then
 * opens the essential question. The feedback id comes from the page (a hidden
 * field): sending the form twice after a network cut updates the same feedback.
 * Works without JavaScript (plain form POST).
 */
export async function startFeedback(formData: FormData) {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value !== "" ? value : null;
  };
  const id = field("feedbackId") ?? "";
  const returnTo = field("returnTo") ?? "/avis";
  const service = field("service");
  try {
    await upsertFeedback(id, {
      establishmentId: field("establishmentId"),
      channel: field("channel"),
      qrCodeId: field("qrCodeId"),
      // "other" = "Autre démarche": no service.
      serviceId: service && service !== "other" ? Number(service) : null,
      visitPeriod: field("visitPeriod"),
      language: defaultLocale,
    });
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}erreur=quand`);
    }
    throw error;
  }
  redirect(`/donner/${id}`);
}

/**
 * Screen 2 → screen 2b: saves the answer to the essential question as soon as
 * it is chosen (each answer is a submit button: one tap, no "Next").
 */
export async function answerEssential(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const option = String(formData.get("option") ?? "");
  await saveAnswer(id, "OVERALL_SATISFACTION", { option });
  redirect(`/donner/${id}/precisions`);
}

/**
 * Screen 2b → the detailed questionnaire (screen 6) when one is published,
 * else the feedback is complete and screen 7 (thanks) follows: the user only
 * sees « Continuer », never a choice between stopping and going on. Saves the topics marked « Bien » or « Pas bien »
 * (fields "topic:CODE") and the free text, both optional (sending nothing is
 * allowed). The text of « Autre » counts only when « Autre » is marked; an
 * emptied comment is removed.
 */
export async function saveDetails(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const topics = [...formData.entries()]
    .filter(([name]) => name.startsWith("topic:"))
    .map(([name, sentiment]) => ({ code: name.slice("topic:".length), sentiment: String(sentiment) }));
  const otherText = String(formData.get("otherText") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  try {
    await saveTopics(id, {
      topics: topics.map((topic) =>
        topic.code === OTHER_TOPIC_CODE && otherText ? { ...topic, otherText } : topic,
      ),
    });
    if (comment) {
      await saveComment(id, { text: comment, promptOption: String(formData.get("promptOption") ?? "") });
    } else {
      await removeComment(id);
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`/donner/${id}/precisions?erreur=1`);
    }
    throw error;
  }
  if ((await countDetailedQuestions(id)) > 0) redirect(`/donner/${id}/questionnaire`);
  await completeFeedback(id);
  redirect(`/donner/${id}/merci`);
}

/**
 * Screen 6 → screen 7: saves the answers given (fields "q:CODE", each one
 * optional), then the feedback is complete. An unknown question or option
 * (a forged sending) comes back with the error message.
 */
export async function saveDetailedAnswers(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([name, value]) => name.startsWith("q:") && typeof value === "string" && value !== "")
      .map(([name, value]) => [name.slice("q:".length), String(value)]),
  );
  try {
    await saveQuestionnaire(id, answers);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "INVALID_INPUT" || error.code === "NOT_FOUND")) {
      redirect(`/donner/${id}/questionnaire?erreur=1`);
    }
    throw error;
  }
  redirect(`/donner/${id}/merci`);
}
