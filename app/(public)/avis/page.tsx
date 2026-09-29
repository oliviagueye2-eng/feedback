import { SiteHeader } from "../../_components/SiteHeader";
import { searchEstablishments } from "@/src/domain/establishment";
import { SearchScreen } from "./SearchScreen";
import styles from "./search.module.css";

/**
 * Screen 0: establishment search. Pages call src/domain directly, not /webapi.
 * With ?q= (form sent without JavaScript, or from the home page ticket stub),
 * the results are rendered on the server.
 */
export default async function SearchPage({ searchParams }: PageProps<"/avis">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const result = query.trim().length >= 2 ? await searchEstablishments(query) : null;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.column}>
          <div className={styles.intro}>
            <h1>Donnez votre avis sur un service public</h1>
            <p className="muted">Anonyme et gratuit. Les résultats sont publiés chaque mois.</p>
          </div>
          <SearchScreen initialQuery={query} initialResult={result} />
        </div>
        <div className={styles.qrSheet}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3" />
          </svg>
          <p>
            Vous êtes au guichet&nbsp;? Ouvrez l&apos;appareil photo de votre téléphone et
            visez le QR code affiché.
          </p>
        </div>
      </main>
    </>
  );
}
