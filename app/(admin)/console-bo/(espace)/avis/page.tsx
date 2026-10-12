import { listFeedbacks, type AdminFeedbackRow } from "@/src/domain/admin";
import { DomainError } from "@/src/domain/errors";
import { getEstablishment } from "@/src/domain/establishment";
import { isUuid } from "@/src/lib/validation";
import { getDictionary } from "../../../../_i18n";
import { Icon } from "../../_components/Icons";
import { requireAdmin } from "../../_lib/auth";
import { formatDateHour } from "../../_lib/format";
import styles from "../../admin.module.css";

const PATH = "/console-bo/avis";

/**
 * The latest feedbacks (asked by Olivia, 2026-10-12), to open one in full and
 * delete a test one. Narrowed to an establishment (?etablissement=, from the
 * dashboard) or to an e-mail or number (?contact=).
 */
export default async function FeedbacksPage({ searchParams }: PageProps<"/console-bo/avis">) {
  await requireAdmin();
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);
  const establishmentId = one(params.etablissement);
  const contact = one(params.contact)?.trim() ?? "";
  const { admin } = await getDictionary();
  const t = admin.feedbacks;
  let feedbacks: AdminFeedbackRow[] = [];
  let contactError = false;
  try {
    feedbacks = await listFeedbacks({ establishmentId, contact });
  } catch (error) {
    if (!(error instanceof DomainError && error.code === "INVALID_INPUT")) throw error;
    contactError = true;
  }
  const establishment =
    establishmentId && isUuid(establishmentId) ? await getEstablishment(establishmentId).catch(() => null) : null;

  const row = (f: AdminFeedbackRow) => (
    <li key={f.id}>
      <div className={styles.entry}>
        <a href={`${PATH}/${f.id}`} className={styles.entryLink}>
          <strong>{f.establishmentName}</strong>
        </a>
        <p className={styles.meta}>
          {f.municipality && <span>{f.municipality}</span>}
          {f.serviceLabel && <span>{f.serviceLabel}</span>}
          {f.satisfactionLabel && <span>{f.satisfactionLabel}</span>}
          {f.hasComment && <span>{t.withComment}</span>}
        </p>
        <p className={styles.meta}>
          <span>
            {f.sent && f.completedAt
              ? t.sentOn.replace("{date}", formatDateHour(f.completedAt))
              : t.notSent.replace("{date}", formatDateHour(f.startedAt))}
          </span>
          <span>{f.contact ?? t.noContact}</span>
        </p>
      </div>
      <div className={styles.actions}>
        <a href={`${PATH}/${f.id}`} className={styles.icon} title={t.open} aria-label={t.open}>
          <Icon name="eye" />
        </a>
      </div>
    </li>
  );

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      {params.supprime !== undefined && (
        <p role="status" className={styles.notice} style={{ marginTop: 16 }}>
          {t.deleted}
        </p>
      )}
      {establishment !== null && (
        <p className={styles.row} style={{ marginTop: 16 }}>
          <strong>{t.filteredOn.replace("{name}", establishment.name)}</strong>
          <a href={PATH} className={styles.link}>
            {t.all}
          </a>
        </p>
      )}
      <form className={styles.filters} method="get" action={PATH}>
        {establishment !== null && <input type="hidden" name="etablissement" value={establishment.id} />}
        <input
          name="contact"
          type="search"
          defaultValue={contact}
          aria-label={t.contact}
          placeholder={t.contactPlaceholder}
          className={styles.input}
          style={{ flex: "0 1 320px" }}
        />
        <button type="submit" className={styles.link}>
          {t.search}
        </button>
        {contact !== "" && (
          <a href={establishment ? `${PATH}?etablissement=${establishment.id}` : PATH} className={styles.link}>
            {t.all}
          </a>
        )}
      </form>
      {contactError ? (
        <p role="alert" className={styles.error}>
          {t.contactError}
        </p>
      ) : feedbacks.length === 0 ? (
        <p className={styles.empty}>{t.empty}</p>
      ) : (
        <ul className={styles.list}>{feedbacks.map(row)}</ul>
      )}
    </>
  );
}
