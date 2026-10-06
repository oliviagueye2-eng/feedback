import Link from "next/link";
import type { ReactNode } from "react";
import { BackLink } from "../../_components/BackLink";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { getDictionary } from "../../_i18n";
import { rich } from "../../_i18n/format";
import { CONTACT_EMAIL, LEGAL_PAGES } from "./links";
import styles from "./legal.module.css";

/** The links a legal text may carry: contact address, calculation page, CDP. */
export function legalText(text: string): ReactNode[] {
  return rich(text, {
    contact: (chunk) => <a href={`mailto:${CONTACT_EMAIL}`}>{chunk}</a>,
    method: (chunk) => <Link href="/resultats/calcul">{chunk}</Link>,
    cdp: (chunk) => <a href="https://www.cdp.sn">{chunk}</a>,
    privacy: (chunk) => <Link href={LEGAL_PAGES.privacy}>{chunk}</Link>,
  });
}

export interface LegalSection {
  title: string;
  paragraphs: readonly string[];
}

export function LegalSections({ sections }: { sections: readonly LegalSection[] }) {
  return sections.map((section) => (
    <section key={section.title} className={styles.section}>
      <h2>{section.title}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph}>{legalText(paragraph)}</p>
      ))}
    </section>
  ));
}

/** The frame of the three legal pages: title, date of the last update, text. */
export async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { common, legal } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <div className={`container ${styles.page}`}>
          <article className={styles.sheet}>
            <h1>{title}</h1>
            <p className={`muted ${styles.updated}`}>{legal.updated}</p>
            {children}
          </article>
          <BackLink href="/" label={common.backHome} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
