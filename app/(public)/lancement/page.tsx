import type { Metadata } from "next";
import Image from "next/image";
import { SOCIAL_ACCOUNTS, SocialIcon } from "../../_components/SocialLinks";
import { getDictionary } from "../../_i18n";
import { LandingHeader } from "./LandingHeader";
import { Reveal } from "./Reveal";
import phoneScreen from "../../../public/images/lancement-ecran-satisfaction.png";
import styles from "./landing.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { landing, header } = await getDictionary();
  const { title, description, imageAlt } = landing.meta;
  const image = { url: "/brand/partage-neexnaxari.png", width: 1200, height: 630, alt: imageAlt };
  return {
    metadataBase: new URL("https://neexnaxari.com"),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", siteName: header.siteName, locale: "fr_SN", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * Pre-launch landing page: shown at the root of neexnaxari.com until the
 * official launch (proxy.ts). Presents the idea, never the platform as open:
 * no feedback button, no figures.
 */
export default async function LandingPage() {
  const { header, landing: t } = await getDictionary();

  return (
    <>
      <LandingHeader t={{ ...t.nav, siteName: header.siteName, tagline: header.tagline, navLabel: header.navLabel }} />
      <main>
        {/* Hero: the idea on the left, the real questionnaire screen on the right. */}
        <section id="accueil" className={`${styles.hero} ${styles.anchor}`}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroText}>
              <p className={styles.label}>{t.hero.label}</p>
              <h1 className={styles.heroTitle}>{t.hero.title}</h1>
              <p className={styles.heroLead}>{t.hero.lead}</p>
              <p className={styles.heroScope}>{t.hero.scope}</p>
              <div className={styles.actions}>
                <a href="#comment-ca-marche" className={styles.primary}>
                  {t.hero.discover}
                </a>
                <a href="#bientot" className={styles.secondary}>
                  {t.hero.follow}
                </a>
              </div>
            </div>
            <div className={styles.phoneStage}>
              <div className={styles.phone}>
                <Image
                  src={phoneScreen}
                  alt={t.hero.phoneAlt}
                  sizes="(min-width: 900px) 300px, 250px"
                  priority
                  className={styles.phoneScreen}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.idea} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <p className={styles.label}>{t.idea.label}</p>
            <h2 className={styles.title}>{t.idea.title}</h2>
            <div className={styles.ideaText}>
              {t.idea.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ol className={styles.chain}>
              {t.idea.chain.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* Examples only: not the list of sectors of the platform. */}
        <section className={`${styles.services} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <h2 className={styles.title}>{t.services.title}</h2>
            <p className={styles.lead}>{t.services.lead}</p>
            <div className={styles.groups}>
              {t.services.groups.map((group) => (
                <div key={group.title} className={styles.group}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className={styles.more}>{t.services.more}</p>
          </div>
        </section>

        <section id="comment-ca-marche" className={`${styles.steps} ${styles.anchor} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <p className={styles.label}>{t.steps.label}</p>
            <h2 className={styles.title}>{t.steps.title}</h2>
            <ol className={styles.stepList}>
              {t.steps.items.map((step, index) => (
                <li key={step.title}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <p className={styles.stepsClosing}>{t.steps.closing}</p>
          </div>
        </section>

        {/* The strong moment of the page: dark ink, very large lines, then the values. */}
        <section id="vision" className={`${styles.vision} ${styles.anchor} ${styles.reveal}`} data-reveal="">
          <div className="container">
            <p className={styles.label}>{t.vision.label}</p>
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

        <section id="bientot" className={`${styles.soon} ${styles.anchor} ${styles.reveal}`} data-reveal="">
          <div className={`container ${styles.soonInner}`}>
            <p className={styles.label}>{t.soon.label}</p>
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
        </div>
      </footer>
      <Reveal />
    </>
  );
}
