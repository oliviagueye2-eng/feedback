import type { Metadata } from "next";
import { getDictionary } from "../../_i18n";
import { LegalPage, LegalSections } from "../_legal/LegalPage";
import styles from "../_legal/legal.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getDictionary();
  return { title: legal.terms.title };
}

export default async function TermsPage() {
  const { legal } = await getDictionary();
  return (
    <LegalPage title={legal.terms.title}>
      <p className={styles.lead}>{legal.terms.intro}</p>
      <LegalSections sections={legal.terms.sections} />
    </LegalPage>
  );
}
