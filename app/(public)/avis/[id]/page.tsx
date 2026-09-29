import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getEstablishment } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { isUuid } from "@/src/lib/validation";
import { EstablishmentScreen } from "../../_feedback/EstablishmentScreen";

/** Screen 1, reached from the search. */
export default async function EstablishmentPage({ params, searchParams }: PageProps<"/avis/[id]">) {
  const { id } = await params;
  const { erreur } = await searchParams;
  if (!isUuid(id)) notFound();
  let establishment;
  try {
    establishment = await getEstablishment(id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--page)" }}>
        <EstablishmentScreen
          establishment={establishment}
          feedbackId={crypto.randomUUID()}
          channel="search"
          returnTo={`/avis/${id}`}
          error={erreur !== undefined}
        />
      </main>
    </>
  );
}
