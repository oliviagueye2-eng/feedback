import type { Metadata } from "next";
import { getDictionary } from "../../_i18n";
import { LegalPage, LegalSections } from "../_legal/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getDictionary();
  return { title: legal.notice.title };
}

export default async function NoticePage() {
  const { legal } = await getDictionary();
  return (
    <LegalPage title={legal.notice.title}>
      <LegalSections sections={legal.notice.sections} />
    </LegalPage>
  );
}
