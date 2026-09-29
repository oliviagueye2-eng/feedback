import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import styles from "./home.module.css";

/** Home page: the queue ticket "C'est votre tour." (variant A, background 2b). */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.ticket}>
              <div className={styles.ticketMain}>
                <span className={styles.watermark} aria-hidden="true" />
                <div className={`muted ${styles.ticketHead}`}>
                  <span>Ticket usager</span>
                  <strong>N° 047</strong>
                </div>
                <h1 className={styles.title}>C&apos;est votre tour.</h1>
                <p className={styles.lead}>
                  Vous sortez d&apos;une mairie, d&apos;un hôpital, d&apos;une école&nbsp;?
                  Dites-nous comment ça s&apos;est passé.
                </p>
              </div>
              <div className={styles.perforation} aria-hidden="true" />
              <div className={styles.stub}>
                <Link href="/avis" className="btn">
                  Donner mon avis
                </Link>
                <p className="muted">Anonyme et gratuit, environ 1 minute.</p>
              </div>
            </div>
            <p className={styles.qr}>
              Encore au guichet&nbsp;? Scannez le QR code affiché : l&apos;établissement
              sera déjà rempli.
            </p>
          </div>
        </section>

        <section className={`container ${styles.steps}`}>
          <h2>Comment ça marche</h2>
          <ol>
            <li>Trouvez l&apos;établissement où vous êtes allé(e).</li>
            <li>Dites si vous êtes satisfait(e). Une seule question est obligatoire.</li>
            <li>Votre avis compte dans les résultats publiés chaque mois.</li>
          </ol>
        </section>
      </main>
    </>
  );
}
