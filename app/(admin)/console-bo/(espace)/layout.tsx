import { countPendingComments, countPendingEstablishments } from "@/src/domain/admin";
import { getDictionary } from "../../../_i18n";
import { NavLink } from "../_components/NavLink";
import { signOutAction } from "../_lib/actions";
import { requireAdmin } from "../_lib/auth";
import styles from "../admin.module.css";

/** The signed-in back-office: the menu on the left (on top on a phone). */
export default async function SpaceLayout({ children }: LayoutProps<"/console-bo">) {
  await requireAdmin();
  const [{ admin: t }, comments, establishments] = await Promise.all([
    getDictionary(),
    countPendingComments(),
    countPendingEstablishments(),
  ]);
  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label={t.nav.label}>
        <div className={styles.brand}>
          {t.brand}
          <small>{t.title}</small>
        </div>
        <hr />
        <NavLink href="/console-bo" label={t.nav.dashboard} />
        <NavLink href="/console-bo/commentaires" label={t.nav.comments} count={comments} />
        <NavLink href="/console-bo/etablissements" label={t.nav.establishments} count={establishments} />
        <NavLink href="/console-bo/questionnaire" label={t.nav.questionnaire} />
        <form action={signOutAction} className={styles.signOut}>
          <button type="submit">{t.nav.signOut}</button>
        </form>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
