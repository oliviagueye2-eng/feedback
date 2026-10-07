import { listPendingEstablishments, type PendingEstablishment } from "@/src/domain/admin";
import { listEstablishmentTypes, listSectors, searchEstablishments } from "@/src/domain/establishment";
import { OTHER_TYPE } from "@/src/domain/types";
import { getDictionary } from "../../../../_i18n";
import { Icon } from "../../_components/Icons";
import { establishmentAction } from "../../_lib/actions";
import { requireAdmin } from "../../_lib/auth";
import { formatDate } from "../../_lib/format";
import styles from "../../admin.module.css";

const PATH = "/console-bo/etablissements";

/**
 * Establishments typed by users who did not find theirs: correct, then
 * validate (shown in the search), merge with one already listed, or refuse.
 * Each action opens a panel under the row (?modifier=, ?fusionner=, ?refuser=):
 * works without JavaScript.
 */
export default async function EstablishmentsPage({ searchParams }: PageProps<"/console-bo/etablissements">) {
  await requireAdmin();
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);
  const editing = one(params.modifier);
  const merging = one(params.fusionner);
  const refusing = one(params.refuser);
  const search = one(params.q)?.trim() ?? "";
  const [{ admin }, establishments, sectors, types, found] = await Promise.all([
    getDictionary(),
    listPendingEstablishments(),
    editing ? listSectors() : [],
    editing ? listEstablishmentTypes() : [],
    merging && search ? searchEstablishments(search) : null,
  ]);
  const t = admin.establishments;
  const open = (key: string, id: string) => `${PATH}?${key}=${encodeURIComponent(id)}#e-${id}`;

  const actionButton = (e: PendingEstablishment, value: string, label: string, icon: "check", tone: string) => (
    <form action={establishmentAction}>
      <input type="hidden" name="id" value={e.id} />
      <button type="submit" name="do" value={value} className={`${styles.icon} ${tone}`} title={label} aria-label={label}>
        <Icon name={icon} />
      </button>
    </form>
  );

  const editPanel = (e: PendingEstablishment) => (
    <form action={establishmentAction} className={styles.panel}>
      <input type="hidden" name="id" value={e.id} />
      {params.erreur !== undefined && (
        <p role="alert" className={styles.error}>
          {t.error}
        </p>
      )}
      <div className={styles.fields}>
        <label>
          {t.name}
          <input name="name" defaultValue={e.name} required minLength={2} maxLength={200} className={styles.input} autoFocus />
        </label>
        <label>
          {t.municipality}
          <input name="municipality" defaultValue={e.municipality ?? ""} maxLength={100} className={styles.input} />
        </label>
        <label>
          {t.sector}
          <select name="sector" defaultValue={e.sectorCode ?? ""} required className={styles.input}>
            <option value="" disabled />
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.type}
          {/* All types, by sector: the server checks the type belongs to the sector chosen. */}
          <select name="type" defaultValue={e.typeCode ?? OTHER_TYPE} className={styles.input}>
            <option value={OTHER_TYPE}>{t.otherType}</option>
            {sectors.map((s) => {
              const ofSector = types.filter((type) => type.sectorCode === s.code);
              return ofSector.length === 0 ? null : (
                <optgroup key={s.code} label={s.label}>
                  {ofSector.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
      </div>
      <p className={styles.meta}>{t.editHelp}</p>
      <div className={styles.row}>
        <button type="submit" name="do" value="save-validate" className={styles.button}>
          {t.saveAndValidate}
        </button>
        <button type="submit" name="do" value="save" className={styles.link}>
          {t.saveOnly}
        </button>
        <a href={PATH} className={styles.link}>
          {t.cancel}
        </a>
      </div>
    </form>
  );

  const mergePanel = (e: PendingEstablishment) => (
    <div className={styles.panel}>
      <form method="get" action={`${PATH}#e-${e.id}`} className={styles.row}>
        <input type="hidden" name="fusionner" value={e.id} />
        <label htmlFor={`q-${e.id}`} style={{ width: "100%" }}>
          {t.mergeWith}
        </label>
        <input
          id={`q-${e.id}`}
          name="q"
          defaultValue={search}
          placeholder={t.mergePlaceholder}
          className={styles.input}
          style={{ flex: "1 1 240px", width: "auto" }}
          autoFocus
        />
        <button type="submit" className={styles.button}>
          {t.mergeSearch}
        </button>
      </form>
      {found && (
        <form action={establishmentAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="hidden" name="id" value={e.id} />
          {found.results.length === 0 ? (
            <p className={styles.meta}>{t.mergeNoResult}</p>
          ) : (
            <>
              <ul className={styles.results}>
                {found.results.map((r) => (
                  <li key={r.id}>
                    <label>
                      <input type="radio" name="targetId" value={r.id} required />
                      <span>
                        {r.name}
                        <span className={styles.meta} style={{ display: "inline" }}>
                          {[r.sectorLabel, r.municipalityName]
                            .filter(Boolean)
                            .map((part) => `, ${part}`)
                            .join("")}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className={styles.meta}>{t.mergeHelp.replace("{n}", String(e.feedbackCount)).replace("{name}", e.name)}</p>
              <div className={styles.row}>
                <button type="submit" name="do" value="merge" className={styles.button}>
                  {t.mergeSubmit}
                </button>
                <a href={PATH} className={styles.link}>
                  {t.cancel}
                </a>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );

  const refusePanel = (e: PendingEstablishment) => (
    <form action={establishmentAction} className={`${styles.panel} ${styles.panelDanger}`}>
      <input type="hidden" name="id" value={e.id} />
      <p className={styles.label} style={{ margin: 0 }}>
        {t.confirmRefuse.replace("{name}", e.name)}
      </p>
      <p className={styles.meta}>{t.confirmRefuseHelp.replace("{n}", String(e.feedbackCount))}</p>
      <div className={styles.row}>
        <button type="submit" name="do" value="refuse" className={`${styles.button} ${styles.danger}`}>
          {t.refuse}
        </button>
        <a href={PATH} className={styles.link}>
          {t.cancel}
        </a>
      </div>
    </form>
  );

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      {establishments.length === 0 ? (
        <p className={styles.empty}>{t.empty}</p>
      ) : (
        <ul className={styles.list} style={{ marginTop: 20 }}>
          {establishments.map((e) => (
            <li key={e.id} id={`e-${e.id}`}>
              <div className={styles.entry}>
                <strong>{e.name}</strong>
                <p className={styles.meta}>
                  <span>{[e.sectorLabel ?? t.noSector, e.typeLabel ?? t.noType].join(", ")}</span>
                  {e.municipality && <span>{e.municipality}</span>}
                  <span>{t.feedbacks.replace("{n}", String(e.feedbackCount))}</span>
                  <span>{t.added.replace("{date}", formatDate(e.createdAt))}</span>
                </p>
              </div>
              <div className={styles.actions}>
                {actionButton(e, "validate", t.validate, "check", styles.ok)}
                <a href={open("modifier", e.id)} className={styles.icon} title={t.edit} aria-label={t.edit}>
                  <Icon name="pencil" />
                </a>
                <a href={open("fusionner", e.id)} className={styles.icon} title={t.merge} aria-label={t.merge}>
                  <Icon name="merge" />
                </a>
                <a href={open("refuser", e.id)} className={`${styles.icon} ${styles.ko}`} title={t.refuse} aria-label={t.refuse}>
                  <Icon name="cross" />
                </a>
              </div>
              {editing === e.id && editPanel(e)}
              {merging === e.id && mergePanel(e)}
              {refusing === e.id && refusePanel(e)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
