import styles from "./loader.module.css";

/**
 * Waiting screen: the logo, still, with a thin tricolour bar sliding under it
 * (option 3 of maquettes/A-loader.dc.html). It shows only after 0.3 s, so a
 * quick answer never flashes it. "overlay" covers the page while a form is sent;
 * "inline" takes the place of the search results.
 */
export function Loader({ message, variant = "overlay" }: { message: string; variant?: "overlay" | "inline" }) {
  return (
    <div className={`${styles.loader} ${styles[variant]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- already cached by the header */}
      <img src="/brand/logo.svg" alt="" width={96} height={102} />
      <span className={styles.bar} aria-hidden="true">
        <i />
      </span>
      <p role="status">{message}</p>
    </div>
  );
}
