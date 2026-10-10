import { listQrPosters, type QrPoster } from "@/src/domain/admin";
import { QR_SITE } from "@/src/lib/qr";
import { getDictionary } from "../../../_i18n";
import { requireAdmin } from "../_lib/auth";
import { qrSvg } from "../_lib/qrSvg";
import admin from "../admin.module.css";
import styles from "./affiches.module.css";
import { PrintButton } from "./PrintButton";

/**
 * Posters to print, one per A4 page: ?codes=CODE1,CODE2 (active codes only).
 * Outside the menu: the page is what gets printed.
 */
export default async function PostersPage({ searchParams }: PageProps<"/console-bo/affiches">) {
  await requireAdmin();
  const params = await searchParams;
  const codes = typeof params.codes === "string" ? params.codes.split(",") : [];
  const [{ admin: a, header }, posters] = await Promise.all([getDictionary(), listQrPosters(codes)]);
  const t = a.qrCodes;
  const back = "/console-bo/qr-codes";

  const poster = (p: QrPoster) => (
    <section key={p.code} className={styles.sheet}>
      <div className={`flag ${styles.band}`} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className={styles.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="" width={47} height={50} />
        <span>
          <strong>NeexNaqari</strong>
          <small>{header.tagline}</small>
        </span>
      </header>

      <div className={styles.body}>
        <h1 className={styles.title}>{t.posterTitle}</h1>
        <p className={styles.place}>{p.establishmentName}</p>
        {(p.serviceLabel || (p.organizationName && !p.establishmentName.startsWith(p.organizationName))) && (
          <p className={styles.service}>{p.serviceLabel ?? p.organizationName}</p>
        )}
        <div className={styles.code} dangerouslySetInnerHTML={{ __html: qrSvg(p.code) }} />
        <p className={styles.scan}>{t.posterScan}</p>
      </div>

      <footer className={styles.stub}>
        <p>
          {t.posterOr} <strong>{`${QR_SITE}/e/${p.code}`}</strong>
        </p>
        {p.locationLabel && <p className={styles.location}>{p.locationLabel}</p>}
      </footer>
    </section>
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <a href={back} className={admin.link} style={{ paddingLeft: 0 }}>
          {t.back}
        </a>
        {posters.length > 0 && (
          <>
            <PrintButton label={t.print} className={admin.button} />
            <span className={styles.help}>{t.printHelp}</span>
          </>
        )}
      </div>
      {posters.length === 0 ? <p className={admin.empty}>{t.noPoster}</p> : posters.map(poster)}
    </div>
  );
}
