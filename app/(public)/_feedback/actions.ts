"use server";

import { redirect } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { defaultLocale } from "../../_i18n";
import {
  addSite,
  chooseSite,
  needsSiteStep,
  nextQuestionPage,
  OTHER_TOPIC_CODE,
  removeComment,
  saveAnswer,
  saveComment,
  saveQuestionnaire,
  saveTopicGates,
  saveTopics,
  submitFeedback,
  upsertFeedback,
  type QuestionPage,
} from "@/src/domain/feedback";
import { questionPageHref, sendPageHref, siteStepHref } from "./links";

/**
 * Screen 1 → screen 2: records the visit (establishment, reason, when), then
 * opens the essential question, or first « Dans quelle agence ? » for a
 * service done in an agency of the organisation. The feedback id comes from the page (a hidden
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
  redirect((await needsSiteStep(id)) ? siteStepHref(id) : `/donner/${id}`);
}

/**
 * « Dans quelle agence ? » → screen 2. Three ways out: an agency of the list
 * (field "site"), « Je ne sais plus » ("site" = the organisation « in
 * general »), or the place typed (field "place"): an agency already known
 * there, else a new one, pending review.
 */
export async function saveSite(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const site = formData.get("site");
  try {
    if (typeof site === "string" && site !== "") {
      await chooseSite(id, site);
    } else {
      await addSite(id, String(formData.get("place") ?? ""));
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`${siteStepHref(id)}?erreur=1`);
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
 * else the last screen (« Envoyer mon avis »): the user only sees
 * « Continuer », never a choice between stopping and going on. Saves
 * the yes/no answers asked in the place of a topic (fields "q:CODE") first,
 * then the topics marked « Bien », « Pas bien » or « Non concerné » (fields
 * "topic:CODE") and the free text, all optional (sending nothing is allowed).
 * A topic hidden by a « Non » is dropped by saveTopics. The text of « Autre »
 * counts only when « Autre » is marked « Bien » or « Pas bien »; an emptied
 * comment is removed.
 */
export async function saveDetails(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const topics = [...formData.entries()]
    .filter(([name]) => name.startsWith("topic:"))
    .map(([name, sentiment]) => ({ code: name.slice("topic:".length), sentiment: String(sentiment) }));
  const gates = Object.fromEntries(
    [...formData.entries()]
      .filter(([name, value]) => name.startsWith("q:") && typeof value === "string" && value !== "")
      .map(([name, value]) => [name.slice("q:".length), String(value)]),
  );
  const otherText = String(formData.get("otherText") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  try {
    await saveTopicGates(id, gates);
    await saveTopics(id, {
      topics: topics.map((topic) =>
        topic.code === OTHER_TOPIC_CODE && otherText && topic.sentiment !== "not_concerned"
          ? { ...topic, otherText }
          : topic,
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
  const next = await nextQuestionPage(id, "details");
  redirect(next ? questionPageHref(id, next) : sendPageHref(id));
}

/**
 * Screen 6 or 6b → the next page of questions, or the last screen (« Envoyer
 * mon avis »): saves the answers given (fields "q:CODE", each one optional).
 * An unknown question or option (a forged sending) comes back with the error
 * message.
 */
export async function saveDetailedAnswers(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  const page: QuestionPage = formData.get("page") === "common" ? "common" : "sector";
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([name, value]) => name.startsWith("q:") && typeof value === "string" && value !== "")
      .map(([name, value]) => [name.slice("q:".length), String(value)]),
  );
  let next: QuestionPage | null;
  try {
    next = await saveQuestionnaire(id, page, answers);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "INVALID_INPUT" || error.code === "NOT_FOUND")) {
      redirect(`${questionPageHref(id, page)}?erreur=1`);
    }
    throw error;
  }
  redirect(next ? questionPageHref(id, next) : sendPageHref(id));
}

/**
 * Last screen → screen 7: the e-mail or phone number and the statement on
 * honour, both required (the browser asks for them first; a wrong number or
 * a missing tick sent anyway comes back with the error message).
 */
export async function sendFeedback(formData: FormData) {
  const id = String(formData.get("feedbackId") ?? "");
  try {
    await submitFeedback(id, {
      contact: String(formData.get("contact") ?? ""),
      attested: formData.get("attested") === "yes",
    });
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`${sendPageHref(id)}?erreur=1`);
    }
    throw error;
  }
  redirect(`/donner/${id}/merci`);
}
