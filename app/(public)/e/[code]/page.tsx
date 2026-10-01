import Link from "next/link";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getDictionary } from "../../../_i18n";
import { getEstablishmentByQrCode } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { findFeedbackToResume } from "@/src/domain/feedback";
import { EstablishmentScreen } from "../../_feedback/EstablishmentScreen";

/**
 * QR code landing: the URL printed in the QR code is /e/{code}. Screen 1 with
 * the establishment (and the counter's service) already known, visit today.
 */
export default async function QrLandingPage({ params, searchParams }: PageProps<"/e/[code]">) {
  const { code } = await params;
  const { avis } = await searchParams;
  let found;
  try {
    found = await getEstablishmentByQrCode(code);
  } catch (error) {
    if (!(error instanceof DomainError && error.code === "NOT_FOUND")) throw error;
  }

  const { qr: t } = await getDictionary();
  // Back from screen 2 with « Précédent »: the same feedback, not a new one.
  const resumed =
    found && typeof avis === "string" ? await findFeedbackToResume(avis, found.establishment.id) : null;
  const returnTo = `/e/${encodeURIComponent(code)}${resumed ? `?avis=${resumed.id}` : ""}`;

  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--page)" }}>
        {found ? (
          <EstablishmentScreen
            establishment={found.establishment}
            feedbackId={resumed?.id ?? crypto.randomUUID()}
            channel="qr"
            returnTo={returnTo}
            initial={resumed ?? undefined}
            qr={{ id: found.qrCodeId, serviceId: found.serviceId }}
          />
        ) : (
          <div className="container" style={{ maxWidth: 596, paddingTop: 24, paddingBottom: 40 }}>
            <h1 style={{ fontSize: 26, lineHeight: 1.15, margin: "0 0 12px" }}>{t.inactiveTitle}</h1>
            <p style={{ margin: "0 0 20px" }}>{t.inactiveText}</p>
            <Link href="/avis" className="btn">
              {t.search}
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
