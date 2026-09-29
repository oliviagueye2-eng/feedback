export function SiteHeader() {
  return (
    <>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="site-header">
        <span className="crest" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="site-name">
          <small>République du Sénégal</small>
          <strong>Avis des usagers</strong>
        </span>
      </header>
    </>
  );
}
