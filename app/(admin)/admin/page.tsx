import { getDictionary } from "../../_i18n";

/**
 * Back-office for agents (validate, merge or close establishments,
 * moderate comments). TODO: authentication before any content.
 */
export default async function AdminPage() {
  const { admin: t } = await getDictionary();
  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h1>{t.title}</h1>
      <p className="muted">{t.comingSoon}</p>
    </main>
  );
}
