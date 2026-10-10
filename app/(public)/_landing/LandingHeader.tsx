"use client";

import { useState } from "react";
import type { Dictionary } from "../../_i18n";
import styles from "./landing.module.css";

type Texts = Dictionary["landing"]["nav"] &
  Pick<Dictionary["header"], "siteName" | "tagline" | "navLabel"> &
  Pick<Dictionary["common"], "giveFeedback">;

/**
 * Header of the landing page, kept at the top while scrolling. Computers: the
 * links on the right. Phones: a menu button opens the same links under the bar.
 */
export function LandingHeader({ t }: { t: Texts }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={`container ${styles.headerInner}`}>
        <a href="#accueil" className="site-home" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
          <img className="site-logo" src="/brand/logo.svg" alt="" width={40} height={42} />
          <span className="site-name">
            <strong>{t.siteName}</strong>
            <small>{t.tagline}</small>
          </span>
        </a>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="landing-nav"
          aria-label={open ? t.closeMenu : t.openMenu}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true" />
        </button>
        <nav id="landing-nav" className={styles.nav} data-open={open} aria-label={t.navLabel}>
          <a href="#comment-ca-marche" onClick={close}>
            {t.howItWorks}
          </a>
          <a href="#vision" onClick={close}>
            {t.vision}
          </a>
          <a href="#donner" className={styles.giveLink} onClick={close}>
            {t.giveFeedback}
          </a>
        </nav>
      </div>
    </header>
  );
}
