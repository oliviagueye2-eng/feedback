import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { FooterFaces } from "../_components/FooterFaces";
import { SOCIAL_ACCOUNTS, SocialIcon } from "../_components/SocialLinks";
import { getDictionary } from "../_i18n";
import { MOUTHS, SatisfactionFace } from "./_feedback/SatisfactionFace";
import { LEGAL_PAGES } from "./_legal/links";
import { IntroSplash } from "./_intro/IntroSplash";
import { LandingHeader } from "./_landing/LandingHeader";
import { Reveal } from "./_landing/Reveal";
import { ServicesDeck, type SectorCard } from "./_landing/ServicesDeck";
import busPhoto from "../../public/images/lancement-bus-tata.jpg";
import healthPhoto from "../../public/images/lancement-centre-de-sante.jpg";
import phoneScreen from "../../public/images/lancement-ecran-satisfaction.png";
import bankPhoto from "../../public/images/services-banque.jpg";
import electricityPhoto from "../../public/images/services-electricite.jpg";
import townHallPhoto from "../../public/images/services-mairie.jpg";
import mobilePaymentPhoto from "../../public/images/services-paiement-mobile.jpg";
import stopPhoto from "../../public/images/lancement-telephone-arret.jpg";
import styles from "./_landing/landing.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { landing, header } = await getDictionary();
  const { title, description, imageAlt } = landing.meta;
  const image = { url: "/brand/partage-neexnaqari.png", width: 1200, height: 630, alt: imageAlt };
  return {
    metadataBase: new URL("https://neexnaqari.com"),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", siteName: header.siteName, locale: "fr_SN", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Condensed capitals for the hero title and the ticket numbers only; everything else stays in Atkinson Hyperlegible. */
const display = Barlow_Condensed({ weight: "800", subsets: ["latin"], variable: "--font-display" });

/** The five satisfaction faces around the phone, as solid tokens, from « Très satisfait(e) » (1) to « Pas du tout » (5). */
const TOKEN_LEVELS = [2, 3, 4, 5, 1] as const;

/** « Tous les services »: one photo card per everyday service, in this order. */
const SERVICE_PHOTOS = {
  transport: busPhoto,
  administration: townHallPhoto,
  bank: bankPhoto,
  health: healthPhoto,
  mobilePayment: mobilePaymentPhoto,
  electricity: electricityPhoto,
} as const;

/** What each ticket shows of the questionnaire: the search, the five faces, the results stamped « Merci ». */
function ticketScenes(search: string, stamp: string) {
  return [
    <span key="search" className={styles.ticketSearch}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <span className={styles.ticketTyped}>{search}</span>
    </span>,
    <span key="faces" className={styles.ticketFaces}>
      {([1, 2, 3, 4, 5] as const).map((level) => (
        <span key={level}>
          <SatisfactionFace level={level} />
        </span>
      ))}
    </span>,
    <span key="results" className={styles.ticketResults}>
      <i />
      <i />
      <i />
      <i />
      <i />
      <span className={styles.ticketStamp}>{stamp}</span>
    </span>,
  ];
}

/** Icons of « Votre expérience → Votre voix → Des résultats partagés chaque mois », with small moving parts. */
const CHAIN_ICONS = [
  // A person.
  <svg key="person" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>,
  // A speech bubble whose dots blink, as when someone is typing.
  <svg key="voice" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16v11H9l-5 4z" />
    <circle className={styles.dot} cx="9" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle className={styles.dot} cx="12" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle className={styles.dot} cx="15" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </svg>,
  // Results: three bars that rise and fall.
  <svg key="results" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path className={styles.bar} d="M6 20v-6" />
    <path className={styles.bar} d="M12 20V8" />
    <path className={styles.bar} d="M18 20V4" />
    <path d="M3 20h18" />
  </svg>,
];

/**
 * Home page. The hero is « L'affiche » (Olivia's choice, 2026-10-16): a very
 * large title, one button to the search for a service, and the phone with the
 * real questionnaire among the five satisfaction faces. On the very first
 * visit, an opening screen plays first (IntroSplash).
 */
export default async function HomePage() {
  const { common, header, intro, landing: t, legal } = await getDictionary();
  const scenes = ticketScenes(t.steps.searchExample, t.steps.stamp);
  const serviceCards: SectorCard[] = (Object.keys(SERVICE_PHOTOS) as (keyof typeof SERVICE_PHOTOS)[]).map((id) => ({
    id,
    ...t.services.cards[id],
    image: SERVICE_PHOTOS[id],
  }));

  return (
    <>
      <IntroSplash t={{ ...intro, siteName: header.siteName, tagline: header.tagline }} />
      <LandingHeader t={{ ...t.nav, giveFeedback: common.giveFeedback, siteName: header.siteName, tagline: header.tagline, navLabel: header.navLabel }} />
      <main>
        {/* Hero: a street poster. One sequence on arrival: the lines rise, the phone
            arrives, a finger taps « Très satisfait(e) » and its token leaps out. */}
        <section id="accueil" className={`${styles.hero} ${styles.anchor} ${display.variable}`}>
          <div className={`container ${styles.heroInner}`}>
            <div>
              <h1 className={styles.heroTitle}>
                {t.hero.titleLines.map((line, index) => (
                  <span key={line} className={styles.line}>
                    <span>{line}</span>
                    {/* Read as one sentence, not three words stuck together. */}
                    {index < t.hero.titleLines.length - 1 && " "}
                  </span>
                ))}
              </h1>
              <p className={styles.heroSectors}>{t.hero.sectors}</p>
              <p className={styles.heroLead}>{t.hero.lead}</p>
              <Link href="/avis" className={`btn ${styles.heroButton}`}>
                {t.hero.giveFeedback}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className={styles.stage}>
              {TOKEN_LEVELS.map((level) => (
                <span key={level} className={styles.token} data-level={level} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="8.6" cy="9.6" r="1.4" fill="#fff" />
                    <circle cx="15.4" cy="9.6" r="1.4" fill="#fff" />
                    <path
                      d={MOUTHS[level]}
                      fill={level === 1 ? "#fff" : "none"}
                      stroke="#fff"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ))}
              <div className={styles.phone}>
                <div className={styles.screen}>
                  <Image src={phoneScreen} alt={t.hero.phoneAlt} sizes="(min-width: 900px) 270px, 210px" priority className={styles.phoneScreen} />
                  {/* The answer « Très satisfait(e) » gets chosen: a tap, then the row lights up. */}
                  <span className={styles.chosen} aria-hidden="true" />
                  <span className={styles.tap} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dark, rounded on top: on computers it slides over the hero, which stays in place. */}
        <section className={`${styles.idea} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <p className={styles.label}>{t.idea.label}</p>
            <h2 className={styles.title}>{t.idea.title}</h2>
            <div className={styles.ideaText}>
              {t.idea.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {/* Three tokens on a line that draws itself, from green to yellow. */}
            <ol className={styles.chain}>
              {t.idea.chain.map((step, index) => (
                <li key={step}>
                  <span className={styles.chainToken} aria-hidden="true">
                    {CHAIN_ICONS[index]}
                  </span>
                  <span className={styles.chainText}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Everyday services as a pile of photo cards that follow one another. */}
        <section className={`${styles.services} ${styles.reveal}`} data-reveal="">
          <div className={`container ${styles.servicesInner}`}>
            <div>
              <h2 className={styles.title}>{t.services.title}</h2>
              <p className={styles.lead}>{t.services.lead}</p>
            </div>
            <ServicesDeck cards={serviceCards} pause={t.services.pause} />
          </div>
        </section>

        {/* « La bande de tickets »: three queue tickets out of a dispenser, each with a glimpse of the questionnaire. */}
        <section id="comment-ca-marche" className={`${styles.steps} ${styles.anchor} ${styles.reveal} ${display.variable}`} data-reveal="">
          <div className="container">
            <div className={styles.stepsTop}>
              <h2 className={styles.title}>{t.steps.title}</h2>
              <Link href="/avis" className={`btn ${styles.heroButton} ${styles.stepsButton}`}>
                {t.hero.giveFeedback}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className={styles.ticketStage}>
              <div className={styles.dispenser} aria-hidden="true" />
              <div className={styles.ticketFeed}>
                <ol className={styles.ticketStrip}>
                  {t.steps.items.map((step, index) => (
                    <li key={step.title} className={styles.ticket}>
                      <span className={styles.ticketHead} aria-hidden="true">
                        {header.siteName}
                      </span>
                      <h3 className={styles.ticketTitle}>
                        <span className={styles.ticketNumber} aria-hidden="true">
                          {index + 1}
                        </span>
                        {step.title}
                      </h3>
                      <p>{step.text}</p>
                      <div className={styles.ticketScene} aria-hidden="true">
                        {scenes[index]}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* The strong moment of the page: dark ink, very large lines, then the values. */}
        <section id="vision" className={`${styles.vision} ${styles.anchor} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <h2 className={styles.visionLines}>
              {t.vision.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className={styles.visionText}>{t.vision.text}</p>
            <h3 className={styles.valuesTitle}>{t.vision.valuesTitle}</h3>
            <ul className={styles.values}>
              {t.vision.values.map((value) => (
                <li key={value.title}>
                  <strong>{value.title}</strong>
                  <span>{value.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="reseaux" className={`${styles.soon} ${styles.anchor} ${styles.reveal}`} data-reveal="">
          {/* Decorative: a passenger on her phone at a bus stop, under a green veil. */}
          <div className={styles.soonPhoto} aria-hidden="true">
            <Image src={stopPhoto} alt="" fill sizes="100vw" />
          </div>
          <div className={`container ${styles.soonInner}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG, nothing to optimize */}
            <img className={styles.soonLogo} src="/brand/logo-blanc.svg" alt="" width={110} height={117} />
            <h2 className={styles.soonTitle}>{t.soon.title}</h2>
            <p className={styles.lead}>{t.soon.text}</p>
            <p className={styles.soonFollow}>{t.soon.follow}</p>
            <ul className={styles.networks}>
              {SOCIAL_ACCOUNTS.map(({ network, url }) => (
                <li key={network}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <SocialIcon network={network} />
                    {t.soon.networks[network]}
                    <span className="visually-hidden"> {t.soon.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.handle}>{t.soon.handle}</p>
          </div>
        </section>
      </main>

      <footer className={`site-footer ${styles.footer}`}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <div className="site-footer-name">
              {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
              <img className="site-footer-logo" src="/brand/logo-blanc.svg" alt="" width={46} height={48} />
              <strong>{header.siteName}</strong>
            </div>
            <em>{header.tagline}.</em>
          </div>
          <nav className={styles.footerNav} aria-label={t.footer.navLabel}>
            <a href="#accueil">{t.footer.home}</a>
            <a href="#comment-ca-marche">{t.nav.howItWorks}</a>
            <a href="#vision">{t.nav.vision}</a>
          </nav>
          <p className={styles.copyright}>{t.footer.copyright}</p>
          <nav className={`site-footer-legal ${styles.footerLegal}`} aria-label={legal.navLabel}>
            <Link href={LEGAL_PAGES.notice}>{legal.notice.title}</Link>
            <Link href={LEGAL_PAGES.privacy}>{legal.privacy.title}</Link>
            <Link href={LEGAL_PAGES.terms}>{legal.terms.title}</Link>
          </nav>
        </div>
        <FooterFaces />
      </footer>
      <Reveal />
    </>
  );
}
