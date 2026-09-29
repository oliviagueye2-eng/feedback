import { getDetailedQuestionnaire } from "@/src/domain/feedback";
import { respond } from "../../../_lib/respond";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/webapi/feedbacks/[id]/questionnaire">,
) {
  const { id } = await ctx.params;
  return respond(() => getDetailedQuestionnaire(id));
}
