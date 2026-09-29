import { saveAnswer } from "@/src/domain/feedback";
import { readJson, respond } from "../../../../_lib/respond";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/webapi/feedbacks/[id]/answers/[questionCode]">,
) {
  const { id, questionCode } = await ctx.params;
  return respond(async () => saveAnswer(id, questionCode, await readJson(request)));
}
