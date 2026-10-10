import {
  getQrEstablishment,
  getQrOrganization,
  QR_LOCATION_MAX_LENGTH,
  searchQrTargets,
  type QrEstablishment,
  type QrOrganization,
} from "@/src/domain/admin";
import { getDictionary } from "../../../../_i18n";
import { qrCodeAction } from "../../_lib/actions";
import { requireAdmin } from "../../_lib/auth";
import { formatDate } from "../../_lib/format";
import { qrSvg } from "../../_lib/qrSvg";
import styles from "../../admin.module.css";

const PATH = "/console-bo/qr-codes";

const postersOf = (codes: string[]) => `/console-bo/affiches?codes=${codes.join(",")}`;

/**
 * QR codes (asked by Olivia, 2026-10-10): search an organisation or a place;
 * a place lists its codes and creates new ones; an organisation lists its
 * places, adds some, and creates or prints the codes of all of them.
 */
export default async function QrCodesPage({ searchParams }: PageProps<"/console-bo/qr-codes">) {
  await requireAdmin();
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
  const search = one(params.q).trim();
  const establishmentId = one(params.etablissement);
  const organizationCode = one(params.organisme);
  const error = params.erreur !== undefined;

  const [{ admin }, establishment, organization, found] = await Promise.all([
    getDictionary(),
    establishmentId ? getQrEstablishment(establishmentId) : null,
    organizationCode ? getQrOrganization(organizationCode) : null,
    !establishmentId && !organizationCode && search ? searchQrTargets(search) : null,
  ]);
  const t = admin.qrCodes;
  const count = (n: number, many: string, single: string, none: string) =>
    n === 0 ? none : n === 1 ? single : many.replace("{n}", String(n));

  const placeView = (e: QrEstablishment) => {
    const active = e.codes.filter((c) => c.isActive).map((c) => c.code);
    return (
      <>
        <p className={styles.meta}>
          <a href={e.organizationCode ? `${PATH}?organisme=${encodeURIComponent(e.organizationCode)}` : PATH} className={styles.link} style={{ padding: 0 }}>
            {e.organizationName ? t.sitesTitle.replace("{name}", e.organizationName) : t.back}
          </a>
        </p>
        <h2 style={{ marginTop: 12 }}>{e.name}</h2>
        <p className={styles.meta}>{[e.organizationName, e.municipality].filter(Boolean).join(", ")}</p>

        <h3 className={styles.qrHeading}>{t.codesTitle}</h3>
        {e.codes.length === 0 ? (
          <p className={styles.empty}>{t.noCodeYet}</p>
        ) : (
          <ul className={styles.list}>
            {e.codes.map((c) => (
              <li key={c.code} className={c.isActive ? styles.qrItem : `${styles.qrItem} ${styles.qrInactive}`}>
                <span className={styles.qrThumb} dangerouslySetInnerHTML={{ __html: qrSvg(c.code) }} />
                <div className={styles.entry}>
                  <strong className={styles.qrCode}>{c.code}</strong>
                  <p className={styles.meta}>
                    <span>{c.serviceLabel ?? t.wholePlace}</span>
                    {c.locationLabel && <span>{c.locationLabel}</span>}
                    <span>{c.isActive ? t.created.replace("{date}", formatDate(c.createdAt)) : t.inactive}</span>
                  </p>
                  {c.isActive && (
                    <p className={styles.row} style={{ gap: 4 }}>
                      <a href={postersOf([c.code])} className={styles.link} style={{ paddingLeft: 0 }}>
                        {t.poster}
                      </a>
                      <a href={`${PATH}/svg/${c.code}`} className={styles.link} download>
                        {t.download}
                      </a>
                    </p>
                  )}
                </div>
                <form action={qrCodeAction}>
                  <input type="hidden" name="code" value={c.code} />
                  <button
                    type="submit"
                    name="do"
                    value={c.isActive ? "deactivate" : "reactivate"}
                    className={styles.link}
                    title={c.isActive ? t.deactivateHelp : undefined}
                  >
                    {c.isActive ? t.deactivate : t.reactivate}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {active.length > 1 && (
          <p style={{ margin: "12px 0 0" }}>
            <a href={postersOf(active)} className={styles.button}>
              {t.printPlace.replace("{n}", String(active.length))}
            </a>
          </p>
        )}

        <form action={qrCodeAction} className={styles.panel} style={{ marginTop: 24 }}>
          <input type="hidden" name="establishmentId" value={e.id} />
          <span className={styles.label}>{t.createTitle}</span>
          {error && (
            <p role="alert" className={styles.error}>
              {t.createError}
            </p>
          )}
          <div className={styles.fields}>
            {e.services.length > 0 && (
              <label>
                {t.service}
                <select name="service" defaultValue="" className={styles.input}>
                  <option value="">{t.wholePlace}</option>
                  {e.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className={styles.fieldHelp}>{t.serviceHelp}</span>
              </label>
            )}
            <label>
              {t.location}
              <input name="location" maxLength={QR_LOCATION_MAX_LENGTH} placeholder={t.locationPlaceholder} className={styles.input} />
              <span className={styles.fieldHelp}>{t.locationHelp}</span>
            </label>
          </div>
          <div className={styles.row}>
            <button type="submit" name="do" value="create" className={styles.button}>
              {t.create}
            </button>
          </div>
        </form>
      </>
    );
  };

  const organizationView = (o: QrOrganization) => {
    const missing = o.sites.filter((s) => s.activeCodes.length === 0).length;
    const codes = o.sites.flatMap((s) => s.activeCodes);
    return (
      <>
        <p className={styles.meta}>
          <a href={PATH} className={styles.link} style={{ padding: 0 }}>
            {t.back}
          </a>
        </p>
        <h2 style={{ marginTop: 12 }}>{t.sitesTitle.replace("{name}", o.name)}</h2>
        {o.sites.length === 0 ? (
          <p className={styles.empty}>{t.noSites.replace("{name}", o.name)}</p>
        ) : (
          <>
            <div className={styles.row} style={{ margin: "12px 0 16px" }}>
              {missing > 0 && (
                <form action={qrCodeAction}>
                  <input type="hidden" name="organization" value={o.code} />
                  <button type="submit" name="do" value="create-missing" className={styles.button}>
                    {t.createMissing.replace("{n}", String(missing))}
                  </button>
                </form>
              )}
              {codes.length > 0 && (
                <a href={postersOf(codes)} className={missing > 0 ? styles.link : styles.button}>
                  {t.printAll.replace("{n}", String(codes.length))}
                </a>
              )}
            </div>
            <ul className={styles.list}>
              {o.sites.map((s) => (
                <li key={s.id}>
                  <div className={styles.entry}>
                    <a href={`${PATH}?etablissement=${s.id}`} className={styles.qrName}>
                      {s.name}
                    </a>
                    <p className={styles.meta}>
                      {s.municipality && <span>{s.municipality}</span>}
                      <span>{count(s.activeCodes.length, t.activeCodes, t.oneActiveCode, t.noCode)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <form action={qrCodeAction} className={styles.panel} style={{ marginTop: 24 }}>
          <input type="hidden" name="organization" value={o.code} />
          <label htmlFor="place">{t.addSiteTitle}</label>
          {error && (
            <p role="alert" className={styles.error}>
              {t.addSiteError}
            </p>
          )}
          <div className={styles.row}>
            <input
              id="place"
              name="place"
              required
              minLength={2}
              maxLength={100}
              placeholder={t.addSitePlaceholder}
              aria-label={t.addSitePlace}
              className={styles.input}
              style={{ flex: "1 1 240px", width: "auto" }}
            />
            <button type="submit" name="do" value="add-site" className={styles.button}>
              {t.addSite}
            </button>
          </div>
          <p className={styles.meta}>{t.addSiteHelp.replace("{name}", o.name)}</p>
        </form>
      </>
    );
  };

  const searchView = () => (
    <>
      <form method="get" action={PATH} className={styles.row} style={{ margin: "20px 0 8px", maxWidth: 640 }}>
        <label htmlFor="q" style={{ width: "100%", fontWeight: 700 }}>
          {t.search}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={search}
          placeholder={t.searchPlaceholder}
          className={styles.input}
          style={{ flex: "1 1 240px", width: "auto" }}
          autoFocus
        />
        <button type="submit" className={styles.button}>
          {t.searchSubmit}
        </button>
      </form>
      {search !== "" && !found && <p className={styles.empty}>{t.searchTooShort}</p>}
      {found && found.organizations.length === 0 && found.establishments.length === 0 && (
        <p className={styles.empty}>{t.noResult}</p>
      )}
      {found && found.organizations.length > 0 && (
        <>
          <h3 className={styles.qrHeading}>{t.organizations}</h3>
          <ul className={styles.list}>
            {found.organizations.map((o) => (
              <li key={o.code}>
                <div className={styles.entry}>
                  <a href={`${PATH}?organisme=${encodeURIComponent(o.code)}`} className={styles.qrName}>
                    {o.name}
                  </a>
                  <p className={styles.meta}>{count(o.sites, t.sites, t.oneSite, t.noSite)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {found && found.establishments.length > 0 && (
        <>
          <h3 className={styles.qrHeading}>{t.places}</h3>
          <ul className={styles.list}>
            {found.establishments.map((e) => (
              <li key={e.id}>
                <div className={styles.entry}>
                  <a href={`${PATH}?etablissement=${e.id}`} className={styles.qrName}>
                    {e.name}
                  </a>
                  <p className={styles.meta}>
                    {e.organizationName && <span>{e.organizationName}</span>}
                    {e.municipality && <span>{e.municipality}</span>}
                    <span>{count(e.codes, t.activeCodes, t.oneActiveCode, t.noCode)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      <div style={{ marginTop: 20 }}>
        {establishment ? placeView(establishment) : organization ? organizationView(organization) : searchView()}
      </div>
    </>
  );
}
