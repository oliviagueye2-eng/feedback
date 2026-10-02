import Link from "next/link";
import { establishmentDetails } from "../../_components/establishmentDetails";
import { organizationLogoSrc } from "../../_components/organizationLogo";
import type { Dictionary } from "../../_i18n";
import { fill, plural, rich } from "../../_i18n/format";
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

/** The texts of the results, given by the page. */
export type SearchTexts = Dictionary["search"];

function Row({ establishment, icon }: { establishment: EstablishmentSummary; icon: boolean }) {
  const under = establishmentDetails(establishment);
  const logo = organizationLogoSrc(establishment.organizationCode);
  return (
    <li>
      <Link href={`/avis/${establishment.id}`} className={styles.row}>
        {icon &&
          (logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize
            <img className={styles.rowLogo} src={logo} alt="" width={36} height={36} loading="lazy" />
          ) : (
            <span className={styles.rowIcon}>
              <BuildingIcon />
            </span>
          ))}
        <span className={styles.rowText}>
          <span>{establishment.name}</span>
          {under && <span className="muted">{under}</span>}
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
  t,
}: {
  /** The text these results answer. */
  query: string;
  /** What the field holds now: "Continuer avec" and "Je ne trouve pas" use it. */
  typed?: string;
  result: EstablishmentSearchResult;
  t: SearchTexts;
}) {
  const count = result.results.length;

  if (count === 0) {
    return (
      <div className={styles.empty}>
        <div role="status" className={styles.emptyStatus}>
          <strong>{t.noResult}</strong>
          <span className="muted">{t.noResultHelp}</span>
        </div>
        {result.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <span className="muted">{t.didYouMean}</span>
            <ul className={styles.box}>
              {result.suggestions.map((e) => (
                <Row key={e.id} establishment={e} icon={false} />
              ))}
            </ul>
          </div>
        )}
        <Link href={newEstablishmentHref(typed)} className="btn">
          {fill(t.continueWith, { query: typed.trim() })}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.results}>
      <p role="status" className="visually-hidden">
        {plural(t.found, count)}
      </p>
      {result.matchType === "service" && (
        <div className={styles.hint}>
          <BuildingIcon />
          <span>{rich(fill(t.serviceHint, { query: query.trim() }))}</span>
        </div>
      )}
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
          <strong>{t.notFound}</strong>
          <span className="muted">{t.notFoundAction}</span>
        </span>
      </Link>
    </div>
  );
}
