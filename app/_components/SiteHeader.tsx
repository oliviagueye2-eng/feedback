import Link from "next/link";
import { getDictionary } from "../_i18n";

export async function SiteHeader() {
  const { header: t } = await getDictionary();
  return (
    <>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="site-header">
        <div className="container site-header-inner">
          {/* Logo and name lead back to the home page, on every page. */}
          <Link href="/" className="site-home">
            {/* Logo (symbol only). Decorative: the name next to it says what the site is. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
            <img className="site-logo" src="/brand/logo.svg" alt="" width={40} height={42} />
            <span className="site-name">
              <strong>{t.siteName}</strong>
              <small>{t.tagline}</small>
            </span>
          </Link>
          <nav className="site-nav" aria-label={t.navLabel}>
            <Link href="/#comment-ca-marche">{t.howItWorks}</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
