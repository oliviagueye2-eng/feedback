import type { Metadata } from "next";
import { BackLink } from "../../../_components/BackLink";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getDictionary } from "../../../_i18n";
import { fill } from "../../../_i18n/format";
import { MIN_FEEDBACK_TO_PUBLISH } from "@/src/domain/stats/results";
import styles from "../[id]/results.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { method: t } = await getDictionary();
  return { title: t.title };
}

/**
 * « Comment sont calculés ces résultats ? », linked from the foot of every
 * results page: the period, the threshold and the rule of the strengths and
 * points to improve, in the words validated on 2026-10-03.
 */
export default async function MethodPage() {
  const { common, method: t } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <div className={`container ${styles.page}`}>
          <article className={styles.sheet}>
            <div className={styles.sheetMain}>
              <h1 className={styles.methodTitle}>{t.title}</h1>
              <section className={styles.section} aria-labelledby="periode">
                <h2 id="periode">{t.periodTitle}</h2>
                <p>{fill(t.period, { threshold: MIN_FEEDBACK_TO_PUBLISH })}</p>
              </section>
              <section className={styles.section} aria-labelledby="points">
                <h2 id="points">{t.highlightsTitle}</h2>
                <p>{t.highlights}</p>
                <p className="muted">{t.highlightsMethod}</p>
              </section>
            </div>
          </article>
          <BackLink href="/" label={common.backHome} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
