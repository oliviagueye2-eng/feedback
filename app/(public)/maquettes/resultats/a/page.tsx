import { BackLink } from "../../../../_components/BackLink";
import { SiteFooter } from "../../../../_components/SiteFooter";
import { SiteHeader } from "../../../../_components/SiteHeader";
import { SatisfactionFace } from "../../../_feedback/SatisfactionFace";
import { MIN_FEEDBACK, SAMPLE, SAMPLE_EMPTY, groups, outOfTen, percent } from "../data";
import styles from "./a.module.css";

/**
 * MAQUETTE A « Sur 10 usagers » : le résultat dit en une phrase, montré par
 * dix visages (les mêmes qu'à l'écran 2). Chiffres fictifs.
 */
export default async function ResultsA({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const { etat } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>{etat === "vide" ? <Empty /> : <Results />}</main>
      <SiteFooter />
    </>
  );
}

function Results() {
  const g = groups();
  const [sat, neutral, unsat] = outOfTen([g.satisfied, g.neutral, g.unsatisfied]);
  const faces = outOfTen(SAMPLE.levels.map((l) => l.count)).flatMap((n, i) => Array(n).fill(i + 1) as number[]);
  const goalTotal = SAMPLE.goal.yes + SAMPLE.goal.partly + SAMPLE.goal.no;
  const [goalYes, goalPartly, goalNo] = outOfTen([SAMPLE.goal.yes, SAMPLE.goal.partly, SAMPLE.goal.no]);
  const good = SAMPLE.topics.filter((t) => t.good > t.bad).sort((a, b) => b.good - a.good).slice(0, 3);
  const bad = SAMPLE.topics.filter((t) => t.bad > t.good).sort((a, b) => b.bad - a.bad).slice(0, 3);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <p className={styles.kicker}>Résultats publiés le {SAMPLE.publishedOn}</p>
        <h1>{SAMPLE.name}</h1>
        <p className="muted">{SAMPLE.details}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.primary}>
          <section className={styles.hero} aria-labelledby="sur-dix">
            <ol className={styles.faces} aria-hidden="true">
              {faces.map((level, i) => (
                <li key={i}>
                  <SatisfactionFace level={level as 1 | 2 | 3 | 4 | 5} />
                </li>
              ))}
            </ol>
            <h2 id="sur-dix" className={styles.sentence}>
              {sat} usagers sur 10 sont satisfaits.
            </h2>
            <p className={styles.rest}>
              {neutral} moyennement satisfaits, {unsat} pas satisfait.
            </p>
            <p className={`muted ${styles.source}`}>
              D&apos;après {SAMPLE.feedbackCount} avis donnés de {SAMPLE.period}.
            </p>

            <details className={styles.detail} open>
              <summary>Voir le détail des {g.total} réponses</summary>
              <ul>
                {SAMPLE.levels.map((l) => (
                  <li key={l.level}>
                    <SatisfactionFace level={l.level} className={styles.smallFace} />
                    <span>{l.label}</span>
                    <span className={styles.count}>
                      {l.count} <span className="muted">({percent(l.count, g.total)} %)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <section className={styles.block} aria-labelledby="demarche">
            <h2 id="demarche">Ont-ils obtenu ce qu&apos;ils venaient chercher ?</h2>
            <ol className={styles.squares} aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <li
                  key={i}
                  className={i < goalYes ? styles.sqYes : i < goalYes + goalPartly ? styles.sqPartly : styles.sqNo}
                />
              ))}
            </ol>
            <p className={styles.blockSentence}>
              <strong>{goalYes} sur 10</strong> ont obtenu ce qu&apos;ils venaient chercher, {goalPartly} en partie,{" "}
              {goalNo} non.
            </p>
            <p className="muted">{goalTotal} personnes ont répondu à cette question.</p>
          </section>

          <section className={styles.block} aria-labelledby="themes">
            <h2 id="themes">Ce que disent les usagers</h2>
            <div className={styles.topics}>
              <div>
                <h3 className={styles.good}>Ce qui va bien</h3>
                <ul>
                  {good.map((t) => (
                    <li key={t.label}>
                      <span>{t.label}</span>
                      <span className="muted">
                        {t.good} avis « bien » sur {t.good + t.bad}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={styles.bad}>Ce qui doit s&apos;améliorer</h3>
                <ul>
                  {bad.map((t) => (
                    <li key={t.label}>
                      <span>{t.label}</span>
                      <span className="muted">
                        {t.bad} avis « pas bien » sur {t.good + t.bad}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.secondary}>
          <section className={styles.block} aria-labelledby="mois">
            <h2 id="mois">Mois par mois</h2>
            <p className="muted">Usagers satisfaits, sur 10</p>
            <ol className={styles.months}>
              {SAMPLE.months.map((m) => {
                const n = m.satisfied === null ? null : Math.round((m.satisfied * 10) / m.count);
                return (
                  <li key={m.month} title={n === null ? `${m.full} : pas assez d'avis` : `${m.full} : ${n} sur 10, ${m.count} avis`}>
                    <span className={styles.barArea}>
                      {n === null ? (
                        <span className={styles.none}>pas assez d&apos;avis</span>
                      ) : (
                        <>
                          <span className={styles.barValue}>{n}</span>
                          <span className={styles.bar} style={{ height: `${n * 10}%` }} />
                        </>
                      )}
                    </span>
                    <span className={styles.monthLabel}>{m.month}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={styles.block} aria-labelledby="calcul">
            <h2 id="calcul">Comment sont faits ces résultats</h2>
            <ul className={styles.notes}>
              <li>Ils regroupent les avis des 3 derniers mois et sont mis à jour chaque mois.</li>
              <li>Un résultat n&apos;est publié qu&apos;à partir de {MIN_FEEDBACK} avis.</li>
              <li>Les avis sont anonymes. Les commentaires écrits ne sont pas publiés.</li>
            </ul>
          </section>

          <a className="btn" href="#">
            Donner mon avis sur cet établissement
          </a>
          <BackLink href="/" label="Retour à l'accueil" />
        </aside>
      </div>
    </div>
  );
}

function Empty() {
  const e = SAMPLE_EMPTY;
  return (
    <div className={`container ${styles.page} ${styles.narrow}`}>
      <header className={styles.head}>
        <h1>{e.name}</h1>
        <p className="muted">{e.details}</p>
      </header>
      <section className={styles.hero}>
        <ol className={`${styles.faces} ${styles.facesEmpty}`} aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i} className={i < e.feedbackCount ? styles.received : undefined} />
          ))}
        </ol>
        <h2 className={styles.sentence}>Pas encore assez d&apos;avis pour publier un résultat.</h2>
        <p className={styles.rest}>
          {e.feedbackCount} avis reçus ces 3 derniers mois. Il en faut au moins {e.threshold}.
        </p>
      </section>
      <a className="btn" href="#">
        Donner mon avis sur cet établissement
      </a>
      <BackLink href="/" label="Retour à l'accueil" />
    </div>
  );
}
