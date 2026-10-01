import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getEstablishment } from "@/src/domain/establishment";
import { findFeedbackToResume } from "@/src/domain/feedback";
import { DomainError } from "@/src/domain/errors";
import { isUuid } from "@/src/lib/validation";
import { EstablishmentScreen } from "../../_feedback/EstablishmentScreen";

/** Screen 1, reached from the search. */
export default async function EstablishmentPage({ params, searchParams }: PageProps<"/avis/[id]">) {
  const { id } = await params;
  const { erreur, avis } = await searchParams;
  if (!isUuid(id)) notFound();
  let establishment;
  try {
    establishment = await getEstablishment(id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  // Back from screen 2 with « Précédent »: the same feedback, not a new one.
  const resumed = typeof avis === "string" ? await findFeedbackToResume(avis, establishment.id) : null;
  const returnTo = resumed ? `/avis/${id}?avis=${resumed.id}` : `/avis/${id}`;

  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--page)" }}>
        <EstablishmentScreen
          establishment={establishment}
          feedbackId={resumed?.id ?? crypto.randomUUID()}
          channel="search"
          returnTo={returnTo}
          error={erreur !== undefined}
          initial={resumed ?? undefined}
        />
      </main>
    </>
  );
}
