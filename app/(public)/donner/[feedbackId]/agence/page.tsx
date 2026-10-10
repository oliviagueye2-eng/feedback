import { notFound } from "next/navigation";
import { DomainError } from "@/src/domain/errors";
import { getSiteScreen } from "@/src/domain/feedback";
import { saveSite } from "../../../_feedback/actions";
import { FeedbackHeader } from "../../../_feedback/FeedbackHeader";
import { BackLink } from "../../../../_components/BackLink";
import { getDictionary } from "../../../../_i18n";
import screen from "../../../_feedback/screen.module.css";
import { SiteChooser } from "./SiteChooser";

/**
 * « Dans quelle agence ? », between screen 1 and screen 2, when the feedback
 * is given to an organisation « in general » for a service done in one of
 * its agencies (service.asks_site). « Précédent » goes back to screen 1.
 */
export default async function SitePage({ params, searchParams }: PageProps<"/donner/[feedbackId]/agence">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  let step;
  try {
    step = await getSiteScreen(feedbackId);
  } catch (error) {
    if (error instanceof DomainError && (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")) notFound();
    throw error;
  }
  const { common, site: t } = await getDictionary();

  return (
    <>
      <FeedbackHeader establishmentName={step.organizationName} serviceLabel={step.serviceLabel} />
      <main style={{ background: "var(--page)" }}>
        <div className={screen.screen}>
          <SiteChooser
            action={saveSite}
            feedbackId={feedbackId}
            generalId={step.generalId}
            currentId={step.currentId}
            sites={step.sites}
            error={erreur !== undefined}
            t={{
              title: t.title,
              placeholder: t.placeholder,
              error: t.error,
              continueWith: t.continueWith,
              submitNoPlace: t.submitNoPlace,
              unknown: t.unknown,
              note: t.note,
            }}
          />
          <BackLink href={`/avis/${step.generalId}?avis=${feedbackId}`} label={common.previous} />
        </div>
      </main>
    </>
  );
}
