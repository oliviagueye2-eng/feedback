import { notFound } from "next/navigation";
import { getFeedback, type AdminFeedback } from "@/src/domain/admin";
import { DomainError } from "@/src/domain/errors";
import { getDictionary } from "../../../../../_i18n";
import { deleteFeedbackAction } from "../../../_lib/actions";
import { requireAdmin } from "../../../_lib/auth";
import { formatDateHour, formatMonth } from "../../../_lib/format";
import styles from "../../../admin.module.css";

const PATH = "/console-bo/avis";

/**
 * One feedback in full (asked by Olivia, 2026-10-12): where and when, every
 * answer, the topics, the comment and the contact. Deleting it asks first
 * (?supprimer=1), without JavaScript.
 */
export default async function FeedbackPage({ params, searchParams }: PageProps<"/console-bo/avis/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let f: AdminFeedback;
  try {
    f = await getFeedback(id);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { admin, establishment: screen1, details } = await getDictionary();
  const t = admin.feedbacks;
  const sentiments = { positive: details.good, negative: details.bad, not_concerned: details.notConcerned };
  const here = `${PATH}/${f.id}`;

  const period = f.visitPeriod ? screen1.periods[f.visitPeriod as keyof typeof screen1.periods] : null;
  const channel =
    f.channel === "qr"
      ? t.channels.qr.replace("{code}", f.qrLocation ? t.qrLocation.replace("{code}", f.qrCode ?? "").replace("{location}", f.qrLocation) : (f.qrCode ?? ""))
      : t.channels[f.channel];
  const facts: [string, string][] = [
    [t.service, f.serviceLabel ?? t.noService],
    [t.channel, channel],
    ...(period ? [[t.when, f.visitMonth ? t.visitMonth.replace("{period}", period).replace("{month}", formatMonth(f.visitMonth)) : period] as [string, string]] : []),
    [t.started, formatDateHour(f.startedAt)],
    [t.sent, f.completedAt ? formatDateHour(f.completedAt) : t.notSentYet],
    ...(!f.completedAt && f.lastPage
      ? [[t.stoppedAt, admin.dashboard.stopPages[f.lastPage as keyof typeof admin.dashboard.stopPages] ?? f.lastPage] as [string, string]]
      : []),
  ];

  return (
    <>
      <p>
        <a href={PATH} className={styles.link} style={{ paddingLeft: 0 }}>
          ← {t.back}
        </a>
      </p>
      <h1>{t.heading.replace("{name}", f.establishmentName)}</h1>
      <p className={styles.meta}>
        {f.organizationName && f.organizationName !== f.establishmentName && <span>{f.organizationName}</span>}
        {f.municipality && <span>{f.municipality}</span>}
      </p>

      <section className={styles.feedbackPart}>
        <h2>{t.visitTitle}</h2>
        <dl className={styles.facts}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.feedbackPart}>
        <h2>{t.answersTitle}</h2>
        {f.answers.length === 0 ? (
          <p className={styles.empty}>{t.noAnswer}</p>
        ) : (
          <dl className={styles.facts}>
            {f.answers.map((a) => (
              <div key={a.questionCode}>
                <dt>{a.questionLabel ?? a.questionCode}</dt>
                <dd>{[a.optionLabel, a.textValue].filter(Boolean).join(" : ")}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className={styles.feedbackPart}>
        <h2>{t.topicsTitle}</h2>
        {f.topics.length === 0 ? (
          <p className={styles.empty}>{t.noTopic}</p>
        ) : (
          <dl className={styles.facts}>
            {f.topics.map((topic) => (
              <div key={topic.code}>
                <dt>
                  {topic.label ?? topic.code}
                  {topic.otherText && ` : ${topic.otherText}`}
                </dt>
                <dd>{sentiments[topic.sentiment]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className={styles.feedbackPart}>
        <h2>{t.commentTitle}</h2>
        {f.comment === null ? (
          <p className={styles.empty}>{t.noComment}</p>
        ) : (
          <>
            <p>« {f.comment.text} »</p>
            <p className={styles.meta}>
              <span>{t.commentStatus[f.comment.status as keyof typeof t.commentStatus] ?? f.comment.status}</span>
              {f.comment.promptLabel && <span>{t.writtenAfter.replace("{answer}", f.comment.promptLabel)}</span>}
            </p>
          </>
        )}
      </section>

      <section className={styles.feedbackPart}>
        <h2>{t.contactTitle}</h2>
        {f.contact === null ? <p className={styles.empty}>{t.noContactDetail}</p> : <p>{f.contact.value}</p>}
        {f.attestedAt && <p className={styles.meta}>{t.attested.replace("{date}", formatDateHour(f.attestedAt))}</p>}
      </section>

      <section className={styles.feedbackPart} id="supprimer">
        {query.supprimer === undefined ? (
          <a href={`${here}?supprimer=1#supprimer`} className={`${styles.button} ${styles.danger}`}>
            {t.delete}
          </a>
        ) : (
          <form action={deleteFeedbackAction} className={`${styles.panel} ${styles.panelDanger}`}>
            <input type="hidden" name="feedbackId" value={f.id} />
            <p className={styles.label} style={{ margin: 0 }}>
              {t.confirmDelete}
            </p>
            <p className={styles.meta}>{t.confirmDeleteHelp}</p>
            <div className={styles.row}>
              <button type="submit" className={`${styles.button} ${styles.danger}`}>
                {t.confirm}
              </button>
              <a href={here} className={styles.link}>
                {t.cancel}
              </a>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
