"use server";

import { redirect } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { saveAnswer, upsertFeedback } from "@/src/domain/feedback";

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
      language: "fr",
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
