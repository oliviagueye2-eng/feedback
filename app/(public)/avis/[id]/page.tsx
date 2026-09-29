import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getEstablishment } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { isUuid } from "@/src/lib/validation";
import styles from "../form.module.css";

/**
 * Screen 1: establishment identified. First version: shows the establishment.
 * TODO: visit reason (list of services), "Quand êtes-vous venu(e) ?", start of the feedback.
 */
export default async function EstablishmentPage({ params }: PageProps<"/avis/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  let establishment;
  try {
    establishment = await getEstablishment(id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  // An organisation rated as a whole (Senelec in general) is not a place: say "organisme".
  const general = establishment.scope === "general";
  const details = [general ? "En général" : establishment.municipalityName, establishment.sectorLabel]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.form}>
          <h1 className={styles.title}>Donnez votre avis sur ce service</h1>
          <div className={styles.identified}>
            <span className={styles.check} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            </span>
            <div>
              <span className="muted">Vous évaluez</span>
              <strong>{establishment.name}</strong>
              {details && <span>{details}</span>}
              <Link href="/avis">
                {general ? "Ce n'est pas le bon organisme ?" : "Ce n'est pas le bon établissement ?"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
