import Link from "next/link";
import { listSectors } from "@/src/domain/establishment";
import { FormValidation } from "../../../_components/FormValidation";
import { PendingLoader } from "../../../_components/PendingLoader";
import { getDictionary } from "../../../_i18n";
import styles from "../form.module.css";
import { createEstablishment } from "./actions";
import { ContinueButton } from "./ContinueButton";

/** Screen 0c: establishment not in the list. Only the name is required. */
export default async function NewEstablishmentPage({ searchParams }: PageProps<"/avis/nouveau">) {
  const { nom, erreur } = await searchParams;
  const name = typeof nom === "string" ? nom : "";
  const sectors = await listSectors();
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
          <FormValidation message={t.error} shown={erreur !== undefined} />
          <input id="name" name="name" className={styles.input} defaultValue={name} required minLength={3} maxLength={200} autoComplete="off" />
        </div>
        <div className={styles.group}>
          <label htmlFor="sector">
            {t.sector} <span className="muted">{common.optional}</span>
          </label>
          <select id="sector" name="sector" className={styles.input} defaultValue="">
            <option value="">{t.sectorPlaceholder}</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.group}>
          <label htmlFor="municipality">
            {t.municipality} <span className="muted">{common.optional}</span>
          </label>
          <input id="municipality" name="municipality" className={styles.input} placeholder={t.municipalityPlaceholder} maxLength={120} autoComplete="off" />
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
