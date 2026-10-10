"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addOrganizationSite,
  correctComment,
  createMissingOrganizationCodes,
  createQrCode,
  correctEstablishment,
  markCommentReviewed,
  mergeEstablishment,
  refuseEstablishment,
  SESSION_DAYS,
  setQrCodeActive,
  signIn,
  validateEstablishment,
} from "@/src/domain/admin";
import { DomainError } from "@/src/domain/errors";
import { adminPassword, clientIp, requireAdmin, SESSION_COOKIE, SIGN_IN_PATH } from "./auth";

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Where to go back after an action: a back-office page only. */
const backTo = (formData: FormData, fallback: string) => {
  const target = field(formData, "returnTo");
  return target.startsWith("/console-bo/") || target === "/console-bo" ? target : fallback;
};

export async function signInAction(formData: FormData) {
  const expected = adminPassword();
  if (expected === "") redirect(`${SIGN_IN_PATH}?erreur=reglage`);
  const result = await signIn(await clientIp(), field(formData, "password"), expected);
  if (!result.ok) redirect(`${SIGN_IN_PATH}?erreur=${result.reason === "blocked" ? "bloque" : "mot-de-passe"}`);
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/console-bo",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect("/console-bo");
}

export async function signOutAction() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/console-bo" });
  redirect(SIGN_IN_PATH);
}

// Comments ---------------------------------------------------------------------

export async function commentAction(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "feedbackId");
  const back = backTo(formData, "/console-bo/commentaires");
  try {
    switch (field(formData, "do")) {
      case "reviewed":
        await markCommentReviewed(id);
        break;
      case "correct":
        await correctComment(id, field(formData, "text"));
        break;
    }
  } catch (error) {
    // Already handled (sent twice), or an empty text: back to the list as it is.
    if (!(error instanceof DomainError)) throw error;
  }
  redirect(back);
}

// Establishments ---------------------------------------------------------------

const ESTABLISHMENTS = "/console-bo/etablissements";

export async function establishmentAction(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  try {
    switch (field(formData, "do")) {
      case "validate":
        await validateEstablishment(id);
        break;
      case "refuse":
        await refuseEstablishment(id);
        break;
      case "merge":
        await mergeEstablishment(id, field(formData, "targetId"));
        break;
      case "save":
      case "save-validate":
        await correctEstablishment(id, {
          name: field(formData, "name"),
          municipality: field(formData, "municipality"),
          sectorCode: field(formData, "sector"),
          typeCode: field(formData, "type"),
        });
        if (field(formData, "do") === "save-validate") await validateEstablishment(id);
        break;
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") {
      redirect(`${ESTABLISHMENTS}?modifier=${encodeURIComponent(id)}&erreur=1`);
    }
    if (!(error instanceof DomainError && error.code === "NOT_FOUND")) throw error;
  }
  redirect(ESTABLISHMENTS);
}

// QR codes ---------------------------------------------------------------------

const QR_CODES = "/console-bo/qr-codes";

export async function qrCodeAction(formData: FormData) {
  await requireAdmin();
  const establishment = (id: string) => `${QR_CODES}?etablissement=${encodeURIComponent(id)}`;
  const organization = (code: string) => `${QR_CODES}?organisme=${encodeURIComponent(code)}`;
  const id = field(formData, "establishmentId");
  const organizationCode = field(formData, "organization");
  let target = QR_CODES;
  try {
    switch (field(formData, "do")) {
      case "create":
        target = establishment(id);
        await createQrCode(id, { serviceId: field(formData, "service"), locationLabel: field(formData, "location") });
        break;
      case "deactivate":
      case "reactivate":
        target = establishment(await setQrCodeActive(field(formData, "code"), field(formData, "do") === "reactivate"));
        break;
      case "create-missing":
        target = organization(organizationCode);
        await createMissingOrganizationCodes(organizationCode);
        break;
      case "add-site":
        target = organization(organizationCode);
        await addOrganizationSite(organizationCode, field(formData, "place"));
        break;
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_INPUT") redirect(`${target}&erreur=1`);
    if (!(error instanceof DomainError && error.code === "NOT_FOUND")) throw error;
  }
  redirect(target);
}
