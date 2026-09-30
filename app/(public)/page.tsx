import Form from "next/form";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { IntroSplash } from "./_intro/IntroSplash";
import styles from "./home.module.css";

/**
 * Home page: the queue ticket "C'est votre tour." over a photo of an everyday
 * public service (BRT bus, Dakar): a band on phones, the right half on computers.
 * On the very first visit, an opening screen plays first (IntroSplash).
 */
export default function HomePage() {
  return (
    <>
      <IntroSplash />
      <SiteHeader />
      <main>
        <section className={styles.hero}>
          <figure className={styles.photo}>
            {/* eslint-disable-next-line @next/next/no-img-element -- already compressed (43 KB), shown at once */}
            <img src="/images/accueil-brt.jpg" alt="Bus du BRT à Dakar" width={736} height={491} />
            <figcaption>Bus du BRT, Dakar</figcaption>
          </figure>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.queue}>
              <div className={styles.ticketWrap}>
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
                  {/* On a computer the search sits in the stub; on a phone only the button shows.
                      next/form: goes to /avis without reloading the whole page (no blank flash),
                      and still works as a plain form before JavaScript has loaded. */}
                  <Form action="/avis" className={styles.stub}>
                    <label htmlFor="home-search" className={styles.searchLabel}>
                      Dans quel établissement êtes-vous allé(e)&nbsp;?
                    </label>
                    <div className={styles.searchField}>
                      <input
                        id="home-search"
                        name="q"
                        type="search"
                        className="field"
                        placeholder="Ex. : mairie de Grand-Yoff"
                      />
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3.5-3.5" />
                      </svg>
                    </div>
                    <button type="submit" className="btn">
                      Donner mon avis
                    </button>
                    <p className="muted">Anonyme et gratuit, environ 1 minute.</p>
                  </Form>
                </div>
              </div>
            </div>

            <div className={styles.qr}>
              <svg
                className={styles.qrIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3" />
              </svg>
              <p className={styles.qrPhone}>
                Encore au guichet&nbsp;? <strong>Scannez le QR code affiché</strong>,
                l&apos;établissement sera déjà rempli.
              </p>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className={`container ${styles.steps}`}>
          <h2>Comment ça marche</h2>
          <ol>
            <li>Trouvez l&apos;établissement où vous êtes allé(e).</li>
            <li>Dites si vous êtes satisfait(e). Une seule question est obligatoire.</li>
            <li>Votre avis compte dans les résultats publiés chaque mois.</li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
