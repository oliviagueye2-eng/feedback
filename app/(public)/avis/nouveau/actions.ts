"use server";

import { redirect } from "next/navigation";
import { createUserEstablishment } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";

/**
 * Screen 0c: creates the establishment typed by the user (pending review),
 * then opens screen 1. Works without JavaScript (plain form POST).
 */
export async function createEstablishment(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  let id: string;
  try {
    ({ id } = await createUserEstablishment({
      name,
      sector: formData.get("sector") || null,
      municipality: formData.get("municipality") || null,
    }));
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`/avis/nouveau?nom=${encodeURIComponent(name)}&erreur=1`);
    }
    throw error;
  }
  redirect(`/avis/${id}`);
}
