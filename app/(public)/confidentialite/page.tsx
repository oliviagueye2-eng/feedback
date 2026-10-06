import type { Metadata } from "next";
import { getDictionary } from "../../_i18n";
import { LegalPage, LegalSections, legalText } from "../_legal/LegalPage";
import styles from "../_legal/legal.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getDictionary();
  return { title: legal.privacy.title };
}

export default async function PrivacyPage() {
  const { legal } = await getDictionary();
  const { summary, before, collected, after } = legal.privacy;
  return (
    <LegalPage title={legal.privacy.title}>
      <p className={styles.lead}>{legalText(summary)}</p>
      <LegalSections sections={before} />
      <section className={styles.section}>
        <h2>{collected.title}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              {collected.headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collected.rows.map(([data, why, howLong]) => (
              <tr key={data}>
                <th scope="row">{data}</th>
                <td data-label={collected.headers[1]}>{why}</td>
                <td data-label={collected.headers[2]}>{howLong}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>{collected.note}</p>
      </section>
      <LegalSections sections={after} />
    </LegalPage>
  );
}
