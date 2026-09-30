import Link from "next/link";
import { listSectors } from "@/src/domain/establishment";
import { PendingLoader } from "../../../_components/PendingLoader";
import styles from "../form.module.css";
import { createEstablishment } from "./actions";

/** Screen 0c: establishment not in the list. Only the name is required. */
export default async function NewEstablishmentPage({ searchParams }: PageProps<"/avis/nouveau">) {
  const { nom, erreur } = await searchParams;
  const name = typeof nom === "string" ? nom : "";
  const sectors = await listSectors();

  return (
    <main className={styles.page}>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={styles.bar}>
        <Link href={name ? `/avis?q=${encodeURIComponent(name)}` : "/avis"} className={styles.back} aria-label="Retour à la recherche">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Votre établissement</h1>
      </div>

      <form action={createEstablishment} className={styles.form}>
        {erreur && (
          <p role="alert" className={styles.error}>
            Indiquez le nom de l&apos;établissement (2 caractères au moins).
          </p>
        )}
        <div className={styles.group}>
          <label htmlFor="name">Nom de l&apos;établissement</label>
          <input id="name" name="name" className={styles.input} defaultValue={name} required minLength={2} maxLength={200} autoComplete="off" />
        </div>
        <div className={styles.group}>
          <label htmlFor="sector">
            Secteur <span className="muted">(facultatif)</span>
          </label>
          <select id="sector" name="sector" className={styles.input} defaultValue="">
            <option value="">Choisir un secteur</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.group}>
          <label htmlFor="municipality">
            Commune ou village <span className="muted">(facultatif)</span>
          </label>
          <input id="municipality" name="municipality" className={styles.input} placeholder="Ex. : Ndiaganiao" maxLength={120} autoComplete="off" />
        </div>
        <div className={styles.note}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          <span>Cet établissement sera ajouté à la liste après vérification. Votre avis compte dès maintenant.</span>
        </div>
        <button type="submit" className="btn">
          Utiliser cet établissement
        </button>
        <PendingLoader message="Enregistrement de l'établissement…" />
      </form>
    </main>
  );
}
