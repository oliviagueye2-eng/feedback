import Link from "next/link";
import { organizationLogoSrc } from "../../_components/organizationLogo";
import { PendingLoader } from "../../_components/PendingLoader";
import { getDictionary } from "../../_i18n";
import type { EstablishmentDetail } from "@/src/db/establishments";
import { startFeedback } from "./actions";
import styles from "./screen.module.css";

const VISIT_PERIODS = ["today", "under_week", "under_month", "over_month"] as const;

/**
 * Screen 1: establishment identified, reason for the visit, when. Shared by
 * the search (/avis/{id}) and the QR code (/e/{code}). With a QR code the
 * visit is today and the counter's service is already known: not asked.
 */
export async function EstablishmentScreen({
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
  const { common, establishment: t } = await getDictionary();
  // An organisation rated as a whole (Senelec in general) is not a place.
  const general = establishment.scope === "general";
  // An organisation as a whole has no municipality: only its sector shows.
  const details = [establishment.municipalityName, establishment.sectorLabel]
    .filter(Boolean)
    .join(", ");
  const qrService = qr?.serviceId ? establishment.services.find((s) => s.id === qr.serviceId) : undefined;
  const askReason = !qr?.serviceId && establishment.services.length > 0;
  const askWhen = channel !== "qr";
  const logo = organizationLogoSrc(establishment.organizationCode);

  return (
    <form action={startFeedback} className={styles.screen}>
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <input type="hidden" name="establishmentId" value={establishment.id} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {qr && <input type="hidden" name="qrCodeId" value={qr.id} />}
      {qr?.serviceId && <input type="hidden" name="service" value={qr.serviceId} />}

      <h1 className={styles.title}>{t.title}</h1>

      <div className={styles.identified}>
        <span className={styles.check} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <div>
          <span className="muted">{t.rating}</span>
          <strong>{establishment.name}</strong>
          {details && <span>{details}</span>}
          {qrService?.label && <span>{qrService.label}</span>}
          <Link href="/avis">
            {general ? t.wrongOrganization : t.wrongEstablishment}
          </Link>
        </div>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize
          <img className={styles.identifiedLogo} src={logo} alt="" width={56} height={56} />
        )}
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {t.whenError}
        </p>
      )}

      {askReason && (
        <div className={styles.group}>
          <label htmlFor="service">{general ? t.reasonGeneral : t.reason}</label>
          <select id="service" name="service" className={styles.select} defaultValue="">
            <option value="">{t.reasonPlaceholder}</option>
            {establishment.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label ?? s.code}
              </option>
            ))}
            <option value="other">{t.reasonOther}</option>
          </select>
        </div>
      )}

      {askWhen && (
        <fieldset className={styles.group}>
          <legend>{general ? t.whenGeneral : t.when}</legend>
          <div className={styles.periods}>
            {VISIT_PERIODS.map((value) => (
              <label key={value} className={styles.period}>
                <input type="radio" name="visitPeriod" value={value} required />
                <span>{t.periods[value]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className={styles.actions}>
        <button type="submit" className="btn">
          {common.giveFeedback}
        </button>
        <p className="muted">{t.duration}</p>
      </div>
      <PendingLoader message={t.loading} />
    </form>
  );
}
