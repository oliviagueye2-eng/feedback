import { BackLink } from "../../../../_components/BackLink";
import { SiteFooter } from "../../../../_components/SiteFooter";
import { SiteHeader } from "../../../../_components/SiteHeader";
import { SatisfactionFace } from "../../../_feedback/SatisfactionFace";
import { MIN_FEEDBACK, SAMPLE, SAMPLE_EMPTY, groups, percent } from "../data";
import styles from "./b.module.css";

/**
 * MAQUETTE B « Le relevé » : les résultats sur une fiche, comme le ticket de
 * l'accueil, tamponnée « Publié » avec la date. Plus de chiffres, en tableaux.
 * Chiffres fictifs.
 */
export default async function ResultsB({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
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
  const goalTotal = SAMPLE.goal.yes + SAMPLE.goal.partly + SAMPLE.goal.no;
  const goal = [
    { key: "yes", label: "Oui", count: SAMPLE.goal.yes, color: "var(--satisfaction-1)" },
    { key: "partly", label: "En partie", count: SAMPLE.goal.partly, color: "var(--satisfaction-3)" },
    { key: "no", label: "Non", count: SAMPLE.goal.no, color: "var(--satisfaction-5)" },
  ];
  const topics = [...SAMPLE.topics].sort((a, b) => b.good - b.bad - (a.good - a.bad));
  const maxTopic = Math.max(...topics.flatMap((t) => [t.good, t.bad]));

  return (
    <div className={`container ${styles.page}`}>
      <article className={styles.sheet}>
        <div className={styles.sheetMain}>
          <span className={styles.watermark} aria-hidden="true" />
          <div className={`muted ${styles.sheetHead}`}>
            <span>Relevé des avis</span>
            <strong>{SAMPLE.period}</strong>
          </div>
          <div className={styles.identity}>
            <h1>{SAMPLE.name}</h1>
            <p className={`muted ${styles.details}`}>{SAMPLE.details}</p>
            <div className={styles.stamp}>
              <strong>Publié</strong>
              <span>{SAMPLE.publishedShort}</span>
            </div>
          </div>

          <section className={styles.section} aria-labelledby="satisfaction">
            <h2 id="satisfaction">Êtes-vous satisfait(e) du service reçu ?</h2>
            <p className={styles.headline}>
              <strong>{percent(g.satisfied, g.total)} %</strong> des usagers sont satisfaits ou très satisfaits, sur{" "}
              {g.total} avis.
            </p>
            <div className={styles.stack} aria-hidden="true">
              {SAMPLE.levels.map((l) => (
                <span
                  key={l.level}
                  style={{ flexGrow: l.count, background: `var(--satisfaction-${l.level})` }}
                  title={`${l.label} : ${l.count} avis`}
                />
              ))}
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Réponse</th>
                  <th scope="col">Avis</th>
                  <th scope="col">Part</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE.levels.map((l) => (
                  <tr key={l.level}>
                    <th scope="row">
                      <SatisfactionFace level={l.level} className={styles.face} />
                      {l.label}
                    </th>
                    <td>{l.count}</td>
                    <td>{percent(l.count, g.total)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.section} aria-labelledby="demarche">
            <h2 id="demarche">Avez-vous obtenu ce que vous étiez venu(e) chercher ?</h2>
            <div className={styles.stack} aria-hidden="true">
              {goal.map((o) => (
                <span key={o.key} style={{ flexGrow: o.count, background: o.color }} />
              ))}
            </div>
            <ul className={styles.legend}>
              {goal.map((o) => (
                <li key={o.key}>
                  <i style={{ background: o.color }} aria-hidden="true" />
                  {o.label} <strong>{percent(o.count, goalTotal)} %</strong>
                </li>
              ))}
            </ul>
            <p className="muted">{goalTotal} réponses à cette question.</p>
          </section>

          <section className={styles.section} aria-labelledby="themes">
            <h2 id="themes">Ce qui a été bien, ce qui ne l&apos;a pas été</h2>
            <p className="muted">Nombre d&apos;usagers qui ont jugé chaque point « Bien » ou « Pas bien ».</p>
            <div className={styles.divergingHead} aria-hidden="true">
              <span>Pas bien</span>
              <span>Bien</span>
            </div>
            <ul className={styles.diverging}>
              {topics.map((t) => (
                <li key={t.label}>
                  <span className={styles.topicLabel}>{t.label}</span>
                  <span className={styles.sideBad}>
                    <span className={styles.num}>{t.bad}</span>
                    <span className={styles.barBad} style={{ width: `${(t.bad / maxTopic) * 100}%` }} />
                  </span>
                  <span className={styles.sideGood}>
                    <span className={styles.barGood} style={{ width: `${(t.good / maxTopic) * 100}%` }} />
                    <span className={styles.num}>{t.good}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="mois">
            <h2 id="mois">Mois par mois</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Mois</th>
                  <th scope="col">Avis</th>
                  <th scope="col">Satisfaits</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE.months.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{m.full} 2026</th>
                    <td>{m.count}</td>
                    <td>
                      {m.satisfied === null ? (
                        <span className="muted">pas assez d&apos;avis</span>
                      ) : (
                        `${percent(m.satisfied, m.count)} %`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className={styles.tear} aria-hidden="true" />
        <div className={styles.stub}>
          <p className="muted">
            Avis des 3 derniers mois, mis à jour chaque mois. Publié à partir de {MIN_FEEDBACK} avis. Les avis sont
            anonymes ; les commentaires écrits ne sont pas publiés.
          </p>
          <a className="btn" href="#">
            Donner mon avis sur cet établissement
          </a>
        </div>
      </article>
      <BackLink href="/" label="Retour à l'accueil" />
    </div>
  );
}

function Empty() {
  const e = SAMPLE_EMPTY;
  return (
    <div className={`container ${styles.page}`}>
      <article className={styles.sheet}>
        <div className={styles.sheetMain}>
          <span className={styles.watermark} aria-hidden="true" />
          <div className={`muted ${styles.sheetHead}`}>
            <span>Relevé des avis</span>
            <strong>3 derniers mois</strong>
          </div>
          <div className={styles.identity}>
            <h1>{e.name}</h1>
            <p className={`muted ${styles.details}`}>{e.details}</p>
            <div className={`${styles.stamp} ${styles.stampWaiting}`}>
              <strong>En attente</strong>
              <span>
                {e.feedbackCount} avis sur {e.threshold}
              </span>
            </div>
          </div>
          <section className={styles.section}>
            <h2>Pas encore assez d&apos;avis pour publier un résultat.</h2>
            <p>
              {e.feedbackCount} avis reçus ces 3 derniers mois. Il en faut au moins {e.threshold} pour que le
              résultat soit fiable et que personne ne puisse être reconnu.
            </p>
          </section>
        </div>
        <div className={styles.tear} aria-hidden="true" />
        <div className={styles.stub}>
          <a className="btn" href="#">
            Donner mon avis sur cet établissement
          </a>
        </div>
      </article>
      <BackLink href="/" label="Retour à l'accueil" />
    </div>
  );
}
