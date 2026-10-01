import { QuestionsScreen } from "../../../_feedback/QuestionsScreen";

/** Screen 6: the questions of the feedback's service or sector. */
export default async function SectorQuestionsPage({ params, searchParams }: PageProps<"/donner/[feedbackId]/questionnaire">) {
  const { feedbackId } = await params;
  const { erreur } = await searchParams;
  return <QuestionsScreen feedbackId={feedbackId} page="sector" error={erreur !== undefined} />;
}
