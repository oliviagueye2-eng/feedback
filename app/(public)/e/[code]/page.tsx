import Link from "next/link";
import { SiteHeader } from "../../../_components/SiteHeader";
import { getEstablishmentByQrCode } from "@/src/domain/establishment";
import { DomainError } from "@/src/domain/errors";
import { EstablishmentScreen } from "../../_feedback/EstablishmentScreen";

/**
 * QR code landing: the URL printed in the QR code is /e/{code}. Screen 1 with
 * the establishment (and the counter's service) already known, visit today.
 */
export default async function QrLandingPage({ params }: PageProps<"/e/[code]">) {
  const { code } = await params;
  let found;
  try {
    found = await getEstablishmentByQrCode(code);
  } catch (error) {
    if (!(error instanceof DomainError && error.code === "NOT_FOUND")) throw error;
  }

  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--page)" }}>
        {found ? (
          <EstablishmentScreen
            establishment={found.establishment}
            feedbackId={crypto.randomUUID()}
            channel="qr"
            returnTo={`/e/${encodeURIComponent(code)}`}
            qr={{ id: found.qrCodeId, serviceId: found.serviceId }}
          />
        ) : (
          <div className="container" style={{ maxWidth: 596, paddingTop: 24, paddingBottom: 40 }}>
            <h1 style={{ fontSize: 26, lineHeight: 1.15, margin: "0 0 12px" }}>Ce QR code n&apos;est plus actif</h1>
            <p style={{ margin: "0 0 20px" }}>Vous pouvez chercher l&apos;établissement par son nom.</p>
            <Link href="/avis" className="btn">
              Chercher l&apos;établissement
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
