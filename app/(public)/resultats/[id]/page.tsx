import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "../../../_components/BackLink";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SiteHeader } from "../../../_components/SiteHeader";
import { establishmentDetails } from "../../../_components/establishmentDetails";
import { getDictionary } from "../../../_i18n";
import { fill, plural, rich } from "../../../_i18n/format";
import { getEstablishment } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { getPublishedResults } from "@/src/domain/stats";
import type { ResultsPeriod } from "@/src/domain/stats/results";
import { isUuid } from "@/src/lib/validation";
import { SATISFACTION_LEVEL, SatisfactionFace } from "../../_feedback/SatisfactionFace";
import styles from "./results.module.css";

/** Colours of yes / partly / no: the ends and the middle of the satisfaction scale. */
const GOAL_COLOR: Record<string, string> = {
  YES: "var(--satisfaction-1)",
  PARTLY: "var(--satisfaction-3)",
  NO: "var(--satisfaction-5)",
};

async function load(id: string) {
  if (!isUuid(id)) notFound();
  try {
    return await getEstablishment(id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/resultats/[id]">): Promise<Metadata> {
  const { id } = await params;
  const establishment = await load(id);
  const { results: t } = await getDictionary();
  return { title: fill(t.pageTitle, { name: establishment.name }) };
}

// Months in French, in Dakar time (UTC).
const monthName = (month: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...options }).format(new Date(`${month}T00:00:00Z`));

/** « juillet à septembre 2026 », or « novembre 2026 à janvier 2027 ». */
function periodText(period: ResultsPeriod, pattern: string) {
  const sameYear = period.from.slice(0, 4) === period.last.slice(0, 4);
  return fill(pattern, {
    from: monthName(period.from, sameYear ? { month: "long" } : { month: "long", year: "numeric" }),
    last: monthName(period.last, { month: "long", year: "numeric" }),
  });
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Public results of an establishment: a sheet like the home page's ticket,
 * stamped « Publié » with the date of publication (design B, 2026-10-03).
 * Under the threshold, the stamp says « En attente » and only the number of
 * feedbacks shows. Written comments are never published.
 */
export default async function ResultsPage({ params }: PageProps<"/resultats/[id]">) {
  const { id } = await params;
  const establishment = await load(id);
  const results = await getPublishedResults(establishment.id);
  const { common, results: t } = await getDictionary();
  const publishedOn = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", dateStyle: "short" }).format(
    new Date(`${results.period.publishedOn}T00:00:00Z`),
  );
  const giveLink = (
    <Link className="btn" href={`/avis/${establishment.id}`}>
      {t.give}
    </Link>
  );

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <div className={`container ${styles.page}`}>
          <article className={styles.sheet}>
            <div className={styles.sheetMain}>
              <span className={styles.watermark} aria-hidden="true" />
              <div className={`muted ${styles.sheetHead}`}>
                <span>{t.sheetLabel}</span>
                <strong>{results.published ? periodText(results.period, t.period) : t.waitingPeriod}</strong>
              </div>
              <div className={styles.identity}>
                <h1>{establishment.name}</h1>
                <p className={`muted ${styles.details}`}>{establishmentDetails(establishment)}</p>
                {results.published ? (
                  <p className={styles.stamp}>
                    <strong>{t.stampPublished}</strong>
                    <span>{publishedOn}</span>
                  </p>
                ) : (
                  <p className={`${styles.stamp} ${styles.stampWaiting}`}>
                    <strong>{t.stampWaiting}</strong>
                    <span>{fill(t.stampCount, { count: results.feedbackCount, threshold: results.threshold })}</span>
                  </p>
                )}
              </div>

              {!results.published ? (
                <section className={styles.section}>
                  <h2>{t.emptyTitle}</h2>
                  <p>
                    {plural(t.emptyCount, results.feedbackCount)} {fill(t.emptyWhy, { threshold: results.threshold })}
                  </p>
                </section>
              ) : (
                <>
                  <section className={styles.section} aria-labelledby="satisfaction">
                    <h2 id="satisfaction">{results.satisfaction.label}</h2>
                    <p className={styles.headline}>
                      {rich(fill(t.satisfiedLead, { percent: results.satisfiedPercent, count: results.feedbackCount }))}
                    </p>
                    <div className={styles.stack} aria-hidden="true">
                      {results.satisfaction.options
                        .filter((o) => o.count > 0)
                        .map((o) => (
                          <span
                            key={o.code}
                            style={{ flexGrow: o.count, background: `var(--satisfaction-${SATISFACTION_LEVEL[o.code]})` }}
                          />
                        ))}
                    </div>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">{t.answer}</th>
                          <th scope="col">{t.count}</th>
                          <th scope="col">{t.share}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.satisfaction.options.map((o) => (
                          <tr key={o.code}>
                            <th scope="row">
                              <span className={styles.answer}>
                                {SATISFACTION_LEVEL[o.code] && (
                                  <SatisfactionFace level={SATISFACTION_LEVEL[o.code]!} className={styles.face} />
                                )}
                                {o.label}
                              </span>
                            </th>
                            <td>{o.count}</td>
                            <td>{o.percent} %</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>

                  {results.goals.map((goal) => (
                    <section key={goal.code} className={styles.section} aria-labelledby={`goal-${goal.code}`}>
                      <h2 id={`goal-${goal.code}`}>{goal.label}</h2>
                      <div className={styles.stack} aria-hidden="true">
                        {goal.options
                          .filter((o) => o.count > 0)
                          .map((o) => (
                            <span key={o.code} style={{ flexGrow: o.count, background: GOAL_COLOR[o.code] ?? "var(--control)" }} />
                          ))}
                      </div>
                      <ul className={styles.legend}>
                        {goal.options.map((o) => (
                          <li key={o.code}>
                            <i style={{ background: GOAL_COLOR[o.code] ?? "var(--control)" }} aria-hidden="true" />
                            {o.label} <strong>{o.percent} %</strong>
                          </li>
                        ))}
                      </ul>
                      <p className="muted">{plural(t.answers, goal.total)}</p>
                    </section>
                  ))}

                  {results.topics.length > 0 && (
                    <section className={styles.section} aria-labelledby="themes">
                      <h2 id="themes">{t.topicsTitle}</h2>
                      <p className="muted">{t.topicsHelp}</p>
                      <div className={styles.divergingHead} aria-hidden="true">
                        <span>{t.bad}</span>
                        <span>{t.good}</span>
                      </div>
                      <ul className={styles.diverging}>
                        {results.topics.map((topic) => {
                          const max = Math.max(...results.topics.flatMap((x) => [x.positive, x.negative]));
                          return (
                            <li key={topic.code}>
                              <span className={styles.topicLabel}>{topic.label}</span>
                              <span className="visually-hidden">
                                {fill(t.topicCounts, { good: topic.positive, bad: topic.negative })}
                              </span>
                              <span className={styles.sideBad} aria-hidden="true">
                                <span className={styles.num}>{topic.negative}</span>
                                <span className={styles.barBad} style={{ width: `${(topic.negative / max) * 100}%` }} />
                              </span>
                              <span className={styles.sideGood} aria-hidden="true">
                                <span className={styles.barGood} style={{ width: `${(topic.positive / max) * 100}%` }} />
                                <span className={styles.num}>{topic.positive}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  <section className={styles.section} aria-labelledby="mois">
                    <h2 id="mois">{t.monthsTitle}</h2>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">{t.month}</th>
                          <th scope="col">{t.count}</th>
                          <th scope="col">{t.satisfied}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.months.map((m) => (
                          <tr key={m.month}>
                            <th scope="row">{capitalize(monthName(m.month, { month: "long", year: "numeric" }))}</th>
                            <td>{m.feedbackCount}</td>
                            <td>
                              {m.satisfiedPercent === null ? (
                                <span className="muted">{t.notEnough}</span>
                              ) : (
                                `${m.satisfiedPercent} %`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
            </div>

            <div className={styles.tear} aria-hidden="true" />
            <div className={styles.stub}>
              {results.published && <p className="muted">{fill(t.rules, { threshold: results.threshold })}</p>}
              {giveLink}
            </div>
          </article>
          <BackLink href="/" label={common.backHome} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
