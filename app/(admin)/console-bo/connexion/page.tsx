import { redirect } from "next/navigation";
import { getDictionary } from "../../../_i18n";
import { signInAction } from "../_lib/actions";
import { adminPassword, isSignedIn } from "../_lib/auth";
import styles from "../admin.module.css";

/** One password (ADMIN_PASSWORD in Vercel); 5 failures in 15 minutes block the address. */
export default async function SignInPage({ searchParams }: PageProps<"/console-bo/connexion">) {
  if (await isSignedIn()) redirect("/console-bo");
  const { erreur } = await searchParams;
  const { admin } = await getDictionary();
  const t = admin.signIn;
  const message =
    adminPassword() === "" || erreur === "reglage"
      ? t.notConfigured
      : erreur === "bloque"
        ? t.blocked
        : erreur === "mot-de-passe"
          ? t.wrong
          : null;
  return (
    <main className={styles.signInPage}>
      <form action={signInAction} className={styles.signInForm}>
        <h1 className={styles.brand} style={{ padding: 0, fontSize: 22, margin: 0 }}>
          {admin.brand}
          <small>{t.restricted}</small>
        </h1>
        {message && (
          <p role="alert" className={styles.error}>
            {message}
          </p>
        )}
        <label htmlFor="password" className={styles.label}>
          {t.password}
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
        <button type="submit" className={styles.button}>
          {t.submit}
        </button>
      </form>
    </main>
  );
}
