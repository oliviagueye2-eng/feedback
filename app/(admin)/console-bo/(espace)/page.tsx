import { dashboardPeriod, getDashboard } from "@/src/domain/admin";
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

const DAY_MS = 86_400_000;

/**
 * What to handle, then the period's feedbacks: sent, not sent, and where they
 * stop. The period (?periode=semaine, or ?periode=dates&du=&au=) is this month
 * by default; « À traiter » ignores it.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/console-bo">) {
  await requireAdmin();
  const { periode, du, au } = await searchParams;
  const period = dashboardPeriod(periode === "semaine" ? "week" : periode === "dates" ? "dates" : "month", du, au);
  const [{ admin }, d] = await Promise.all([getDictionary(), getDashboard(period)]);
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
  // The days the figures count, as the database counts them (UTC, the time in Dakar).
  const from = new Date(`${period.from}T00:00:00Z`);
  const to = new Date(`${period.to}T00:00:00Z`);
  const periodText =
    period.from === period.to
      ? fill(t.periodOneDay, { date: day(to, true) })
      : fill(t.period, { from: day(from, from.getUTCFullYear() !== to.getUTCFullYear()), to: day(to, true) });
  const today = new Date().toISOString().slice(0, 10);
  const lastWeekEnd = lastWeek ? new Date(Date.parse(`${lastWeek.week}T00:00:00Z`) + 7 * DAY_MS).toISOString().slice(0, 10) : "";
  const lastCaption =
    lastWeek && lastWeek.week <= today && today < lastWeekEnd
      ? fill(t.thisWeek, { n: lastWeek.count })
      : fill(t.lastWeek, { date: shortDate(lastWeek?.week ?? period.to), n: lastWeek?.count ?? 0 });

  return (
    <>
      <h1>{t.title}</h1>
      <form className={styles.period} method="get" action="/console-bo">
        <select name="periode" aria-label={t.periodLabel} defaultValue={period.kind === "week" ? "semaine" : period.kind === "dates" ? "dates" : ""} className={styles.input}>
          <option value="">{t.periodMonth}</option>
          <option value="semaine">{t.periodWeek}</option>
          <option value="dates">{t.periodDates}</option>
        </select>
        <span className={styles.periodDates}>
          <label>
            {t.periodFrom}
            <input type="date" name="du" defaultValue={period.from} className={styles.input} />
          </label>
          <label>
            {t.periodTo}
            <input type="date" name="au" defaultValue={period.to} className={styles.input} />
          </label>
        </span>
        <button type="submit" className={styles.link}>
          {t.periodApply}
        </button>
      </form>
      <p className={styles.meta}>{periodText}</p>
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
          <div className={styles.figure}>{d.figures.complete}</div>
        </div>
        <div>
          <p className={styles.meta}>{t.notSent}</p>
          <div className={styles.figure}>{d.figures.notSent}</div>
        </div>
        <div>
          <p className={styles.meta}>{t.abandon}</p>
          <div className={styles.figure}>{d.figures.abandonPercent === null ? dash : `${d.figures.abandonPercent} %`}</div>
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
              lastCaption={lastCaption}
              points={d.weeks.map((w) => ({
                label: shortDate(w.week),
                count: w.count,
                detail: fill(t.weekOf, { date: shortDate(w.week), n: w.count }),
              }))}
            />
          </section>
          <section className={styles.chart}>
            <h2>{t.satisfactionTitle}</h2>
            <ShareBar label={t.satisfactionComplete} percent={d.figures.satisfiedComplete} none={dash} />
            <ShareBar label={t.satisfactionNotSent} percent={d.figures.satisfiedNotSent} none={dash} />
            <p className={styles.meta}>{t.satisfactionHelp}</p>
          </section>
        </div>
      </div>
    </>
  );
}
