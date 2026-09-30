import { getDictionary } from "../_i18n";

export async function SiteFooter() {
  const { footer: t } = await getDictionary();
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-state">
          {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
          <img className="site-footer-logo" src="/brand/logo-blanc.svg" alt="" width={46} height={48} />
          <div className="flag flag-small" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <strong>{t.state}</strong>
          <em>{t.motto}</em>
        </div>
        <div className="site-footer-text">
          <p>{t.privacy}</p>
          <p>{t.purpose}</p>
        </div>
      </div>
    </footer>
  );
}
