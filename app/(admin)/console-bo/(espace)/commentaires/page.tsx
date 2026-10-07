import { COMMENT_MAX_LENGTH } from "@/src/domain/feedback";
import { listComments, type AdminComment } from "@/src/domain/admin";
import { getDictionary } from "../../../../_i18n";
import { Icon } from "../../_components/Icons";
import { commentAction } from "../../_lib/actions";
import { requireAdmin } from "../../_lib/auth";
import { formatMonth, mayHoldPersonalDetails } from "../../_lib/format";
import styles from "../../admin.module.css";

const PATH = "/console-bo/commentaires";

/**
 * The comments to read: never published (decided 2026-10-07). Read them,
 * remove personal details. The correction opens a panel under the comment
 * (?corriger=): works without JavaScript. No deletion for now (Olivia,
 * 2026-10-07: nothing is shown anywhere).
 */
export default async function CommentsPage({ searchParams }: PageProps<"/console-bo/commentaires">) {
  await requireAdmin();
  const params = await searchParams;
  const reviewed = params.voir === "relus";
  const newestFirst = params.ordre === "recents";
  const [{ admin }, comments, pending] = await Promise.all([
    getDictionary(),
    listComments(reviewed ? "reviewed" : "pending", newestFirst),
    reviewed ? listComments("pending", false) : null,
  ]);
  const t = admin.comments;
  const pendingCount = pending ? pending.length : comments.length;
  const query = new URLSearchParams({ ...(reviewed && { voir: "relus" }), ...(newestFirst && { ordre: "recents" }) });
  const returnTo = query.size > 0 ? `${PATH}?${query}` : PATH;
  const openWith = (key: string, id: string) => {
    const q = new URLSearchParams(query);
    q.set(key, id);
    return `${PATH}?${q}#c-${id}`;
  };

  const row = (c: AdminComment) => (
    <li key={c.feedbackId} id={`c-${c.feedbackId}`}>
      <div className={styles.entry}>
        <p className={styles.meta}>
          <strong>{c.establishmentName}</strong>
          {c.serviceLabel && <span>{c.serviceLabel}</span>}
          {c.visitMonth && <span>{t.visit.replace("{month}", formatMonth(c.visitMonth))}</span>}
          {c.satisfactionLabel && <span>{c.satisfactionLabel}</span>}
          {!c.sent && <span>{t.notSent}</span>}
        </p>
        <p>« {c.text} »</p>
        {mayHoldPersonalDetails(c.text) && <span className={styles.notice}>{t.maybePersonal}</span>}
      </div>
      <div className={styles.actions}>
        {!reviewed && (
          <form action={commentAction}>
            <input type="hidden" name="feedbackId" value={c.feedbackId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" name="do" value="reviewed" className={`${styles.icon} ${styles.ok}`} title={t.markReviewed} aria-label={t.markReviewed}>
              <Icon name="check" />
            </button>
          </form>
        )}
        <a href={openWith("corriger", c.feedbackId)} className={styles.icon} title={t.correct} aria-label={t.correct}>
          <Icon name="pencil" />
        </a>
      </div>
      {params.corriger === c.feedbackId && (
        <form action={commentAction} className={styles.panel}>
          <input type="hidden" name="feedbackId" value={c.feedbackId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label htmlFor={`text-${c.feedbackId}`}>{t.keptText}</label>
          <textarea
            id={`text-${c.feedbackId}`}
            name="text"
            rows={3}
            required
            maxLength={COMMENT_MAX_LENGTH}
            defaultValue={c.text}
            className={styles.input}
            autoFocus
          />
          <p className={styles.meta}>{t.keptHelp}</p>
          <div className={styles.row}>
            <button type="submit" name="do" value="correct" className={styles.button}>
              {t.save}
            </button>
            <a href={returnTo} className={styles.link}>
              {t.cancel}
            </a>
          </div>
        </form>
      )}
    </li>
  );

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      <form className={styles.filters} method="get" action={PATH}>
        <select name="voir" aria-label={t.show} defaultValue={reviewed ? "relus" : ""} className={styles.input}>
          <option value="">{t.pending.replace("{n}", String(pendingCount))}</option>
          <option value="relus">{t.reviewed}</option>
        </select>
        <select name="ordre" aria-label={t.order} defaultValue={newestFirst ? "recents" : ""} className={styles.input}>
          <option value="">{t.oldest}</option>
          <option value="recents">{t.newest}</option>
        </select>
        <button type="submit" className={styles.link}>
          {t.apply}
        </button>
      </form>
      {comments.length === 0 ? (
        <p className={styles.empty}>{reviewed ? t.emptyReviewed : t.empty}</p>
      ) : (
        <ul className={styles.list}>{comments.map(row)}</ul>
      )}
    </>
  );
}
