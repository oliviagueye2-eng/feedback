import Link from "next/link";
import { guessFromName, listEstablishmentTypes, listSectors } from "@/src/domain/establishment";
import { FormValidation } from "../../../_components/FormValidation";
import { PendingLoader } from "../../../_components/PendingLoader";
import { getDictionary } from "../../../_i18n";
import styles from "../form.module.css";
import { createEstablishment } from "./actions";
import { ContinueButton } from "./ContinueButton";
import { SectorAndType } from "./SectorAndType";

/**
 * Screen 0c: establishment not in the list. Name, sector and type are required.
 * On arrival from the search, the type (and its sector) and the locality are
 * guessed from the name typed (« mairie Touba »: Mairie, Touba).
 */
export default async function NewEstablishmentPage({ searchParams }: PageProps<"/avis/nouveau">) {
  const { nom, secteur, erreur } = await searchParams;
  const name = typeof nom === "string" ? nom : "";
  const [sectors, types] = await Promise.all([listSectors(), listEstablishmentTypes()]);
  // Back with an error, the sector sent is kept; otherwise the name says what it can.
  const guess = secteur === undefined ? guessFromName(name, types) : { type: null, locality: "" };
  const initialSector = sectors.find((s) => s.code === (guess.type?.sectorCode ?? secteur))?.code ?? "";
  const error = erreur === "secteur" || erreur === "type" ? erreur : null;
  const { common, newEstablishment: t } = await getDictionary();

  return (
    <main className={styles.page}>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={styles.bar}>
        <Link href={name ? `/avis?q=${encodeURIComponent(name)}` : "/avis"} className={styles.back} aria-label={t.backToSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>{t.title}</h1>
      </div>

      <form action={createEstablishment} className={styles.form}>
        <div className={styles.group}>
          <label htmlFor="name">{t.name}</label>
          <FormValidation message={t.error} shown={erreur === "nom" || erreur === "1"} names={["name"]} />
          <input id="name" name="name" className={styles.input} defaultValue={name} required minLength={3} maxLength={200} autoComplete="off" />
        </div>
        <SectorAndType
          sectors={sectors}
          types={types}
          initialSector={initialSector}
          initialType={guess.type?.code ?? ""}
          error={error}
          t={{ sector: t.sector, sectorError: t.sectorError, type: t.type, typeError: t.typeError, other: t.other, change: t.change }}
        />
        <div className={styles.group}>
          <label htmlFor="municipality">
            {t.municipality} <span className="muted">{common.optional}</span>
          </label>
          <input id="municipality" name="municipality" className={styles.input} placeholder={t.municipalityPlaceholder} defaultValue={guess.locality.slice(0, 120)} maxLength={120} autoComplete="off" />
        </div>
        <div className={styles.note}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          <span>{t.note}</span>
        </div>
        <ContinueButton fieldId="name" initialName={name} t={{ withName: t.submit, noName: t.submitNoName }} />
        <PendingLoader message={t.saving} />
      </form>
    </main>
  );
}
