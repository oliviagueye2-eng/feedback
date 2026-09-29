import Link from "next/link";
import type { EstablishmentDetail } from "@/src/db/establishments";
import { startFeedback } from "./actions";
import styles from "./screen.module.css";

const VISIT_PERIODS = [
  ["today", "Aujourd'hui"],
  ["under_week", "Il y a moins d'une semaine"],
  ["under_month", "Il y a moins d'un mois"],
  ["over_month", "Il y a plus d'un mois"],
] as const;

/**
 * Screen 1: establishment identified, reason for the visit, when. Shared by
 * the search (/avis/{id}) and the QR code (/e/{code}). With a QR code the
 * visit is today and the counter's service is already known: not asked.
 */
export function EstablishmentScreen({
  establishment,
  feedbackId,
  channel,
  returnTo,
  qr,
  error,
}: {
  establishment: EstablishmentDetail;
  /** New for each display of the page; sent back by the form. */
  feedbackId: string;
  channel: "search" | "qr";
  /** This page's address, to come back to with an error message. */
  returnTo: string;
  qr?: { id: string; serviceId: number | null };
  error?: boolean;
}) {
  // An organisation rated as a whole (Senelec in general) is not a place.
  const general = establishment.scope === "general";
  const details = [general ? "En général" : establishment.municipalityName, establishment.sectorLabel]
    .filter(Boolean)
    .join(", ");
  const qrService = qr?.serviceId ? establishment.services.find((s) => s.id === qr.serviceId) : undefined;
  const askReason = !qr?.serviceId && establishment.services.length > 0;
  const askWhen = channel !== "qr";

  return (
    <form action={startFeedback} className={styles.screen}>
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <input type="hidden" name="establishmentId" value={establishment.id} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {qr && <input type="hidden" name="qrCodeId" value={qr.id} />}
      {qr?.serviceId && <input type="hidden" name="service" value={qr.serviceId} />}

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
          {qrService?.label && <span>{qrService.label}</span>}
          <Link href="/avis">
            {general ? "Ce n'est pas le bon organisme ?" : "Ce n'est pas le bon établissement ?"}
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          Indiquez quand vous êtes venu(e).
        </p>
      )}

      {askReason && (
        <div className={styles.group}>
          <label htmlFor="service">{general ? "Sur quoi porte votre avis ?" : "Motif de votre visite"}</label>
          <select id="service" name="service" className={styles.select} defaultValue="">
            <option value="">Choisir dans la liste</option>
            {establishment.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label ?? s.code}
              </option>
            ))}
            <option value="other">Autre démarche</option>
          </select>
        </div>
      )}

      {askWhen && (
        <fieldset className={styles.group}>
          <legend>{general ? "Quand est-ce arrivé ?" : "Quand êtes-vous venu(e) ?"}</legend>
          <div className={styles.periods}>
            {VISIT_PERIODS.map(([value, label]) => (
              <label key={value} className={styles.period}>
                <input type="radio" name="visitPeriod" value={value} required />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className={styles.actions}>
        <button type="submit" className="btn">
          Donner mon avis
        </button>
        <p className="muted">Anonyme, environ 1 minute.</p>
      </div>
    </form>
  );
}
