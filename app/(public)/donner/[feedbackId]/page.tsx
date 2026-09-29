import { SiteHeader } from "../../../_components/SiteHeader";

/**
 * Screens 2 to 7 (essential question, topics, detailed questionnaire, thanks).
 * TODO: to be built; for now, confirms that the visit was recorded.
 */
export default async function FeedbackPage({ params }: PageProps<"/donner/[feedbackId]">) {
  await params;
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--page)" }}>
        <div className="container" style={{ maxWidth: 596, paddingTop: 24, paddingBottom: 40 }}>
          <h1 style={{ fontSize: 26, lineHeight: 1.15, margin: "0 0 12px" }}>Votre visite est enregistrée</h1>
          <p className="muted" style={{ margin: 0 }}>
            La question « Êtes-vous satisfait(e) du service reçu ? » sera ajoutée à la prochaine étape.
          </p>
        </div>
      </main>
    </>
  );
}
