import { QuestionsScreen } from "../../../../_feedback/QuestionsScreen";

/** Screen 6b: the common questions (every sector), on their own page. */
export default async function CommonQuestionsPage({ params, searchParams }: PageProps<"/donner/[feedbackId]/questionnaire/commun">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  return <QuestionsScreen feedbackId={feedbackId} page="common" error={erreur !== undefined} />;
}
