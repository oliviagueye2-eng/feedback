import Link from "next/link";
import { getDictionary } from "../../_i18n";
import { CompactContext } from "./CompactContext";

/**
 * Header of the screens after screen 1: the logo, then what is being rated.
 * The organisation (« Qui ? ») leads, the visit reason (« Quoi ? ») sits under
 * it, smaller and grey but still easy to read. On phones, once this header
 * has scrolled away, a one-line bar keeps both in view (CompactContext).
 */
export async function FeedbackHeader({
  establishmentName,
  serviceLabel,
}: {
  establishmentName: string;
  serviceLabel: string | null;
}) {
  const { common } = await getDictionary();
  return (
    <>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="site-header" id="feedback-header">
        <div className="container site-header-inner">
          {/* The logo leads back to the home page, as on the other screens. */}
          <Link href="/" aria-label={common.home} className="site-logo-link">
            {/* eslint-disable-next-line @next/next/no-img-element -- small SVG, nothing to optimize */}
            <img className="site-logo" src="/brand/logo.svg" alt="" width={40} height={42} />
          </Link>
          <span className="rated-context">
            <strong>{establishmentName}</strong>
            {serviceLabel && <span>{serviceLabel}</span>}
          </span>
        </div>
      </header>
      <CompactContext watchId="feedback-header" establishmentName={establishmentName} serviceLabel={serviceLabel} />
    </>
  );
}
