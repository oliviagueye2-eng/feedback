import { getDashboard } from "@/src/domain/admin";
import { getDictionary } from "../../../_i18n";
import { ShareBar, StopBars, StopLegend, WeekLine } from "../_components/Charts";
import { requireAdmin } from "../_lib/auth";
import styles from "../admin.module.css";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

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

  return (
    <>
      <h1>{t.title}</h1>
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
