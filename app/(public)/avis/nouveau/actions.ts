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
  const sector = String(formData.get("sector") ?? "");
  let id: string;
  try {
    ({ id } = await createUserEstablishment({
      name,
      sector: sector || null,
      type: formData.get("type") || null,
      municipality: formData.get("municipality") || null,
    }));
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      const error = name.trim().length < 3 ? "nom" : sector ? "type" : "secteur";
      const params = new URLSearchParams({ nom: name, secteur: sector, erreur: error });
      redirect(`/avis/nouveau?${params}`);
    }
    throw error;
  }
  redirect(`/avis/${id}`);
}
