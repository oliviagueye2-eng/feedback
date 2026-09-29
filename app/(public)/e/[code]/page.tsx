import { SiteHeader } from "../../../_components/SiteHeader";

/**
 * QR code landing: the URL printed in the QR code is /e/{code}.
 * TODO: load the establishment with getEstablishmentByQrCode(code) and
 * show screen 1 (establishment identified, visit reason).
 */
export default async function QrLandingPage({ params }: PageProps<"/e/[code]">) {
  const { code } = await params;
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 26, lineHeight: 1.15 }}>Donnez votre avis sur ce service</h1>
        <p className="muted">Code du guichet : {code}</p>
      </main>
    </>
  );
}
