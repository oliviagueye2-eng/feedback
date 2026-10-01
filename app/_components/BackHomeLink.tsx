import Link from "next/link";
import styles from "./backHomeLink.module.css";

/**
 * « ‹ Retour à l'accueil », at the bottom of the search page and of screen 1:
 * the same link at the same place from one screen to the next.
 */
export function BackHomeLink({ label }: { label: string }) {
  return (
    <Link href="/" className={styles.link}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}
