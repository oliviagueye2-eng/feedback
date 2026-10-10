import Form from "next/form";
import type { Dictionary } from "../../_i18n";
import styles from "./ticket.module.css";

type Texts = Pick<Dictionary["home"], "ticketLabel" | "ticketNumber" | "title" | "duration"> &
  Pick<Dictionary["common"], "searchLabel" | "searchPlaceholder" | "giveFeedback">;

/**
 * The queue ticket « C'est votre tour. » under the home page's title (Olivia's
 * choice C, 2026-10-10): the search goes to /avis. next/form: no full reload,
 * and still a plain form before JavaScript has loaded.
 */
export function LandingTicket({ t }: { t: Texts }) {
  return (
    <div id="donner" className={styles.ticket}>
      <div className={styles.main}>
        <span className={styles.watermark} aria-hidden="true" />
        <div className={`muted ${styles.head}`}>
          <span>{t.ticketLabel}</span>
          <strong>{t.ticketNumber}</strong>
        </div>
        <p className={styles.title}>{t.title}</p>
      </div>
      <div className={styles.perforation} aria-hidden="true" />
      <Form action="/avis" className={styles.stub}>
        <label htmlFor="home-search" className={styles.label}>
          {t.searchLabel}
        </label>
        <input id="home-search" name="q" type="search" className="field" placeholder={t.searchPlaceholder} />
        <button type="submit" className="btn">
          {t.giveFeedback}
        </button>
        <p className="muted">{t.duration}</p>
      </Form>
    </div>
  );
}
