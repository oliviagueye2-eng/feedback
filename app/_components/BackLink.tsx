import Link from "next/link";
import styles from "./backLink.module.css";

/**
 * « ‹ Retour à l'accueil » or « ‹ Précédent », at the bottom of the screens:
 * the same link at the same place from one screen to the next.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.link}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}
