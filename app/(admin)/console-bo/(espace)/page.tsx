import { getDashboard } from "@/src/domain/admin";
import { getDictionary } from "../../../_i18n";
import { ShareBar, StopBars, StopLegend, WeekLine } from "../_components/Charts";
import { requireAdmin } from "../_lib/auth";
import styles from "../admin.module.css";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** « 1er octobre », « 8 octobre 2026 »: French writes the first day of a month « 1er ». */
const day = (date: Date, withYear: boolean) => {
  const n = date.getUTCDate();
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(date);
  return `${n === 1 ? "1er" : n} ${month}${withYear ? ` ${date.getUTCFullYear()}` : ""}`;
};

/** What to handle, then this month's feedbacks: sent, not sent, and where they stop. */
export default async function DashboardPage() {
  await requireAdmin();
  const [{ admin }, d] = await Promise.all([getDictionary(), getDashboard()]);
  const t = admin.dashboard;
  const dash = "—";

  const todo = [
    d.pendingComments > 0 && (
      <a key="c" href="/console-bo/commentaires">
        <strong>{d.pendingComments === 1 ? t.todoComment : fill(t.todoComments, { n: d.pendingComments })}</strong>
      </a>
    ),
    d.pendingEstablishments > 0 && (
      <a key="e" href="/console-bo/etablissements">
        <strong>
          {d.pendingEstablishments === 1
            ? t.todoEstablishment
            : fill(t.todoEstablishments, { n: d.pendingEstablishments })}
        </strong>
      </a>
    ),
  ].filter(Boolean);

  const lastWeek = d.weeks.at(-1);
  // The month the figures count, as the database counts it (UTC, the time in Dakar).
  const today = new Date();
  const period =
    today.getUTCDate() === 1
      ? fill(t.periodOneDay, { date: day(today, true) })
      : fill(t.period, { from: day(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)), false), to: day(today, true) });

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.meta}>{period}</p>
      <p className={styles.lead}>
        {todo.length === 0 ? (
          t.nothingTodo
        ) : (
          <>
            {t.todo} {todo[0]}
            {todo[1] && (
              <>
                {" "}
                {t.todoAnd} {todo[1]}
              </>
            )}
            .
          </>
        )}
      </p>

      <section className={styles.commented}>
        <h2>{t.commentedTitle}</h2>
        {d.commented.length === 0 ? (
          <p className={styles.empty}>{t.commentedEmpty}</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t.commentedEstablishment}</th>
                  <th scope="col">{t.commentedTotal}</th>
                  <th scope="col">{t.commentedPending}</th>
                </tr>
              </thead>
              <tbody>
                {d.commented.map((e) => {
                  const q = new URLSearchParams({ etablissement: e.establishmentId, ...(e.pending === 0 && { voir: "relus" }) });
                  return (
                    <tr key={e.establishmentId}>
                      <th scope="row">
                        <a href={`/console-bo/commentaires?${q}`}>{e.name}</a>
                        {e.municipality && <span className={styles.muted}>{e.municipality}</span>}
                      </th>
                      <td>{e.total}</td>
                      <td>{e.pending === 0 ? dash : <strong>{e.pending}</strong>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className={styles.meta}>{t.commentedHelp}</p>
          </>
        )}
      </section>

      <section className={styles.month} aria-label={t.monthLabel}>
        <div>
          <p className={styles.meta}>{t.complete}</p>
          <div className={styles.figure}>{d.month.complete}</div>
        </div>
        <div>
          <p className={styles.meta}>{t.notSent}</p>
          <div className={styles.figure}>{d.month.notSent}</div>
        </div>
        <div>
          <p className={styles.meta}>{t.abandon}</p>
          <div className={styles.figure}>{d.month.abandonPercent === null ? dash : `${d.month.abandonPercent} %`}</div>
        </div>
      </section>

      <section className={styles.commented}>
        <h2>{t.byEstablishmentTitle}</h2>
        {d.byEstablishment.length === 0 ? (
          <p className={styles.empty}>{t.byEstablishmentEmpty}</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t.commentedEstablishment}</th>
                  <th scope="col">{t.byEstablishmentComplete}</th>
                  <th scope="col">{t.byEstablishmentNotSent}</th>
                </tr>
              </thead>
              <tbody>
                {d.byEstablishment.map((e) => (
                  <tr key={e.establishmentId}>
                    <th scope="row">
                      <strong>{e.name}</strong>
                      {e.municipality && <span className={styles.muted}>{e.municipality}</span>}
                    </th>
                    <td>{e.complete === 0 ? dash : e.complete}</td>
                    <td>{e.notSent === 0 ? dash : e.notSent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.meta}>{t.byEstablishmentHelp}</p>
          </>
        )}
      </section>

      <div className={styles.charts}>
        <section className={styles.chart}>
          <h2>{t.stopsTitle}</h2>
          <StopLegend satisfied={t.satisfied} notSatisfied={t.notSatisfied} />
          <StopBars
            label={t.stopsTitle}
            bars={d.stops.map((s) => {
              const page = t.stopPages[s.page];
              return {
                label: page,
                satisfied: s.satisfied,
                notSatisfied: s.notSatisfied,
                caption: s.percent === null ? String(s.total) : `${s.total} (${s.percent} %)`,
                detail: fill(t.stopTooltip, { page, total: s.total, satisfied: s.satisfied, notSatisfied: s.notSatisfied }),
              };
            })}
          />
          <p className={styles.meta}>{t.stopsHelp}</p>
        </section>
        <div className={styles.chartColumn}>
          <section className={styles.chart}>
            <h2>{t.weeksTitle}</h2>
            <WeekLine
              label={t.weeksTitle}
              lastCaption={fill(t.thisWeek, { n: lastWeek?.count ?? 0 })}
              points={d.weeks.map((w) => ({
                label: shortDate(w.week),
                count: w.count,
                detail: fill(t.weekOf, { date: shortDate(w.week), n: w.count }),
              }))}
            />
          </section>
          <section className={styles.chart}>
            <h2>{t.satisfactionTitle}</h2>
            <ShareBar label={t.satisfactionComplete} percent={d.month.satisfiedComplete} none={dash} />
            <ShareBar label={t.satisfactionNotSent} percent={d.month.satisfiedNotSent} none={dash} />
            <p className={styles.meta}>{t.satisfactionHelp}</p>
          </section>
        </div>
      </div>
    </>
  );
}
