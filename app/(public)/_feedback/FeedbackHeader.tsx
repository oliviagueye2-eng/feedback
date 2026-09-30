/**
 * Header of the screens after screen 1: the logo, then what is being rated
 * (the establishment, and the visit reason when there is one), as in the mock-up.
 */
export function FeedbackHeader({
  establishmentName,
  serviceLabel,
}: {
  establishmentName: string;
  serviceLabel: string | null;
}) {
  return (
    <>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="site-header">
        <div className="container site-header-inner">
          {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
          <img className="site-logo" src="/brand/logo.svg" alt="" width={40} height={42} />
          <span className="site-name">
            {serviceLabel ? (
              <>
                <small>{establishmentName}</small>
                <strong>{serviceLabel}</strong>
              </>
            ) : (
              <strong>{establishmentName}</strong>
            )}
          </span>
        </div>
      </header>
    </>
  );
}
