import { SiteHeader } from "../../_components/SiteHeader";
import { searchEstablishments } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import type { EstablishmentSearchResult } from "@/src/domain/types";

/**
 * Screen 0: establishment search. Works without JavaScript (GET form,
 * rendered on the server). Pages call src/domain directly, not /webapi.
 * TODO: autocomplete (screen 0a) as a small client component calling
 * GET /webapi/establishments.
 */
export default async function SearchPage({ searchParams }: PageProps<"/avis">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  let result: EstablishmentSearchResult | null = null;
  let unavailable = false;
  if (query) {
    try {
      result = await searchEstablishments(query);
    } catch (error) {
      if (!(error instanceof DomainError && error.code === "NOT_IMPLEMENTED")) throw error;
      unavailable = true;
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: "0 0 20px" }}>
          Donnez votre avis sur un service public
        </h1>
        <form method="get" action="/avis" style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label htmlFor="q" style={{ fontWeight: 700, fontSize: 17 }}>
            Dans quel établissement êtes-vous allé(e)&nbsp;?
          </label>
          <input
            id="q"
            name="q"
            type="search"
            className="field"
            defaultValue={query}
            placeholder="Ex. : mairie de Grand-Yoff"
          />
          <button type="submit" className="btn">
            Rechercher
          </button>
        </form>

        {unavailable && (
          <p role="status" className="muted">
            La recherche n&apos;est pas encore branchée à la base de données.
          </p>
        )}
        {result && result.results.length === 0 && (
          <p role="status">Aucun résultat exact. Vérifiez l&apos;orthographe, ou continuez quand même.</p>
        )}
        {result && result.results.length > 0 && (
          <ul>
            {result.results.map((e) => (
              <li key={e.id}>{e.name}</li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
