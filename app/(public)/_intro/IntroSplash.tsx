"use client";

import { useRef } from "react";
import type { Dictionary } from "../../_i18n";
import { LOGO_PARTS } from "./logoParts";
import styles from "./intro.module.css";

/**
 * Opening screen of the home page (option 2 of maquettes/A-premiere-visite.dc.html):
 * the logo builds itself, the name appears, then the screen slides up after
 * 2.2 s. « Passer » sends it away at once. It shows only when <html> has
 * data-intro, set before the page is painted by introScript (root layout).
 * Arrivals by QR code never see it: they land on /e/{code}, not on the home page.
 */
export function IntroSplash({ t }: { t: Dictionary["intro"] & Pick<Dictionary["header"], "siteName" | "tagline"> }) {
  const splash = useRef<HTMLDivElement>(null);

  // Once gone, the splash stays gone, even when coming back to the home page.
  function leave(event: React.AnimationEvent) {
    if (event.target === splash.current) document.documentElement.removeAttribute("data-intro");
  }

  return (
    <div ref={splash} className={styles.splash} aria-hidden="true" onAnimationEnd={leave}>
      <button
        type="button"
        className={styles.skip}
        tabIndex={-1}
        onClick={() => document.documentElement.setAttribute("data-intro", "skip")}
      >
        {t.skip}
      </button>
      <svg className={styles.logo} viewBox="0 0 1200 1274">
        {LOGO_PARTS.map((part, i) => (
          <path key={i} fill={part.fill} d={part.d} style={{ animationDelay: `${i * 0.075}s` }} />
        ))}
      </svg>
      <p className={styles.name}>
        <strong>{t.siteName}</strong>
        <small>{t.tagline}</small>
      </p>
    </div>
  );
}
