import { getDictionary } from "../_i18n";

export async function SiteFooter() {
  const { footer: t, header } = await getDictionary();
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        {/* The site's own name and motto: no State name or national motto while no
            public body officially runs the platform (decided 2026-10-03). */}
        <div className="site-footer-brand">
          <div className="site-footer-name">
            {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
            <img className="site-footer-logo" src="/brand/logo-blanc.svg" alt="" width={46} height={48} />
            <strong>{header.siteName}</strong>
          </div>
          <div className="flag flag-small" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <em>{header.tagline}</em>
        </div>
        <div className="site-footer-text">
          <p>{t.privacy}</p>
          <p>{t.purpose}</p>
        </div>
      </div>
    </footer>
  );
}
