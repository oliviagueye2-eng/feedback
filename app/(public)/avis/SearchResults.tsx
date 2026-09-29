import Link from "next/link";
import type { EstablishmentSearchResult, EstablishmentSummary } from "@/src/domain/types";
import styles from "./search.module.css";

/** Link to screen 0c, the name prefilled with what the user typed. */
export const newEstablishmentHref = (query: string) =>
  `/avis/nouveau?nom=${encodeURIComponent(query.trim())}`;

const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18" />
    <path d="M5 21V8l7-4 7 4v13" />
    <path d="M9 21v-5h6v5" />
  </svg>
);

/** Under the name: municipality and sector, whichever are known; "En général" for an organisation as a whole. */
const details = (e: EstablishmentSummary) =>
  [e.scope === "general" ? "En général" : e.municipalityName, e.sectorLabel].filter(Boolean).join(", ");

function Row({ establishment, icon }: { establishment: EstablishmentSummary; icon: boolean }) {
  return (
    <li>
      <Link href={`/avis/${establishment.id}`} className={styles.row}>
        {icon && (
          <span className={styles.rowIcon}>
            <BuildingIcon />
          </span>
        )}
        <span className={styles.rowText}>
          <span>{establishment.name}</span>
          {details(establishment) && <span className="muted">{details(establishment)}</span>}
        </span>
        {!icon && (
          <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </Link>
    </li>
  );
}

/** Screens 0a (results) and 0b (no result). Rendered on the server and in the browser. */
export function SearchResults({
  query,
  typed = query,
  result,
}: {
  /** The text these results answer. */
  query: string;
  /** What the field holds now: "Continuer avec" and "Je ne trouve pas" use it. */
  typed?: string;
  result: EstablishmentSearchResult;
}) {
  const count = result.results.length;

  if (count === 0) {
    return (
      <div className={styles.empty}>
        <div role="status" className={styles.emptyStatus}>
          <strong>Aucun résultat exact</strong>
          <span className="muted">
            Vérifiez l&apos;orthographe, ou continuez : votre avis sera pris en compte.
          </span>
        </div>
        {result.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <span className="muted">Vouliez-vous dire :</span>
            <ul className={styles.box}>
              {result.suggestions.map((e) => (
                <Row key={e.id} establishment={e} icon={false} />
              ))}
            </ul>
          </div>
        )}
        <Link href={newEstablishmentHref(typed)} className="btn">
          Continuer avec « {typed.trim()} »
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.results}>
      <p role="status" className="visually-hidden">
        {count === 1 ? "1 établissement trouvé" : `${count} établissements trouvés`}
      </p>
      {result.matchType === "service" && (
        <div className={styles.hint}>
          <BuildingIcon />
          <span>
            <strong>Précisez l&apos;établissement.</strong> Voici ceux qui proposent
            « {query.trim()} ». Ajoutez la commune pour affiner.
          </span>
        </div>
      )}
      <h2 className={styles.sectionTitle}>Établissements</h2>
      <ul className={styles.list}>
        {result.results.map((e) => (
          <Row key={e.id} establishment={e} icon />
        ))}
      </ul>
      <Link href={newEstablishmentHref(typed)} className={`${styles.row} ${styles.notFound}`}>
        <span className={styles.rowIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className={styles.rowText}>
          <strong>Je ne trouve pas mon établissement</strong>
          <span className="muted">Le saisir moi-même</span>
        </span>
      </Link>
    </div>
  );
}
