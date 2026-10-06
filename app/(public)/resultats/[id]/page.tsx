import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "../../../_components/BackLink";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SiteHeader } from "../../../_components/SiteHeader";
import { establishmentDetails } from "../../../_components/establishmentDetails";
import { getDictionary } from "../../../_i18n";
import { fill, plural } from "../../../_i18n/format";
import { getEstablishment } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { getPublishedResults } from "@/src/domain/stats";
import type { ResultsPeriod } from "@/src/domain/stats/results";
import { isUuid } from "@/src/lib/validation";
import { SATISFACTION_LEVEL, SatisfactionFace } from "../../_feedback/SatisfactionFace";
import { TopicGauge } from "./TopicGauge";
import styles from "./results.module.css";

/** Colours of yes / partly / no (and their variants): the ends and the middle of the satisfaction scale. */
const OUTCOME_COLOR: Record<string, string> = {
  YES: "var(--satisfaction-1)",
  ALL: "var(--satisfaction-1)",
  PARTLY: "var(--satisfaction-3)",
  SOME: "var(--satisfaction-3)",
  SOME_ABSENCES: "var(--satisfaction-3)",
  NO: "var(--satisfaction-5)",
  NONE: "var(--satisfaction-5)",
  MANY_ABSENCES: "var(--satisfaction-5)",
};

/** Short label under a gauge: the one of the dictionary, or the topic's label without its brackets. */
const shortLabel = (short: Record<string, string>, code: string, label: string) =>
  short[code] ?? label.replace(/\s*\(.*\)\s*$/, "");

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
function periodText(period: Pick<ResultsPeriod, "from" | "last">, pattern: string) {
  const sameYear = period.from.slice(0, 4) === period.last.slice(0, 4);
  return fill(pattern, {
    from: monthName(period.from, sameYear ? { month: "long" } : { month: "long", year: "numeric" }),
    last: monthName(period.last, { month: "long", year: "numeric" }),
  });
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Public results of an establishment: a sheet like the home page's ticket,
 * stamped « Mis à jour » with the date of publication (design B, version 2,
 * 2026-10-03). Under the threshold, the stamp says « En attente » and only the
 * number of feedbacks shows. Written comments are never published, nor the
 * full list of topics: only the strengths and points to improve.
 */
export default async function ResultsPage({ params, searchParams }: PageProps<"/resultats/[id]">) {
  const { id } = await params;
  // Coming from the thanks page: the feedback was just given, no button to give it (2026-10-06).
  const justGiven = (await searchParams).avis === "envoye";
  const establishment = await load(id);
  const results = await getPublishedResults(establishment.id);
  const { common, results: t } = await getDictionary();
  const publishedOn = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", dateStyle: "short" }).format(
    new Date(`${results.period.publishedOn}T00:00:00Z`),
  );
  const giveLink = !justGiven && (
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
                  </p>
                )}
              </div>

              {!results.published ? (
                <section className={styles.section}>
                  <h2>{t.emptyTitle}</h2>
                  <p>{fill(t.emptyWhy, { threshold: results.threshold })}</p>
                </section>
              ) : (
                <>
                  <section className={styles.section} aria-labelledby="satisfaction">
                    <h2 id="satisfaction">{t.satisfactionTitle}</h2>
                    <p className={`muted ${styles.question}`}>{results.satisfaction.label}</p>
                    <p className={styles.headline}>
                      <strong>{fill(t.satisfiedPercent, { percent: results.satisfiedPercent })}</strong>
                      <span className={`muted ${styles.count}`}>{plural(t.feedbackCount, results.feedbackCount)}</span>
                      <span className={styles.label}>{t.satisfiedLabel}</span>
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
                      {/* Each row reads on its own (« 14 avis », « 29 % »): the header is for screen readers only. */}
                      <thead className="visually-hidden">
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

                  {(results.strengths.length > 0 || results.improvements.length > 0) && (
                    <section className={styles.section} aria-labelledby="themes">
                      <h2 id="themes">{t.topicsTitle}</h2>
                      <p className={`muted ${styles.question}`}>{t.topicsHelp}</p>
                      <ul className={styles.gauges}>
                        {[
                          ...results.strengths.map((topic) => ({ topic, strength: true })),
                          ...results.improvements.map((topic) => ({ topic, strength: false })),
                        ].map(({ topic, strength }) => (
                          <TopicGauge
                            key={topic.code}
                            code={topic.code}
                            label={shortLabel(t.topicShort, topic.code, topic.label)}
                            kind={strength ? t.strength : t.improvement}
                            percent={topic.percent}
                            count={plural(t.feedbackCount, topic.total)}
                            strength={strength}
                          />
                        ))}
                      </ul>
                    </section>
                  )}

                  {results.outcomes.length > 0 && (
                    <section className={styles.section} aria-labelledby="resultat">
                      <h2 id="resultat">{t.goalTitle}</h2>
                      {results.outcomes.map((outcome) => (
                        <div key={outcome.code} className={styles.outcome}>
                          <p className={`muted ${styles.question}`}>{outcome.label}</p>
                          <div className={styles.stack} aria-hidden="true">
                            {outcome.options
                              .filter((o) => o.count > 0)
                              .map((o) => (
                                <span
                                  key={o.code}
                                  style={{ flexGrow: o.count, background: OUTCOME_COLOR[o.code] ?? "var(--control)" }}
                                />
                              ))}
                          </div>
                          <ul className={styles.legend}>
                            {outcome.options.map((o) => (
                              <li key={o.code}>
                                <i style={{ background: OUTCOME_COLOR[o.code] ?? "var(--control)" }} aria-hidden="true" />
                                {o.label} <strong>{o.percent} %</strong>
                              </li>
                            ))}
                          </ul>
                          <p className="muted">{plural(t.feedbackCount, outcome.total)}</p>
                        </div>
                      ))}
                    </section>
                  )}

                  <section className={styles.section} aria-labelledby="evolution">
                    <h2 id="evolution">{t.evolutionTitle}</h2>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">{t.month}</th>
                          <th scope="col">{t.count}</th>
                          <th scope="col">{t.satisfied}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.quarters.map((q) => (
                          <tr key={q.from}>
                            <th scope="row">{capitalize(periodText(q, t.period))}</th>
                            <td>{q.feedbackCount}</td>
                            <td>
                              {q.satisfiedPercent === null ? (
                                <span className="muted">{t.notEnough}</span>
                              ) : (
                                `${q.satisfiedPercent} %`
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

            {(results.published || giveLink) && (
              <>
                <div className={styles.tear} aria-hidden="true" />
                <div className={styles.stub}>
                  {results.published && (
                    <p className="muted">
                      {t.rules}{" "}
                      <Link className={styles.methodLink} href="/resultats/calcul">
                        {t.methodLink}
                      </Link>
                    </p>
                  )}
                  {giveLink}
                </div>
              </>
            )}
          </article>
          <BackLink href="/" label={common.backHome} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
