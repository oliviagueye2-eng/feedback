import { saveTopics } from "@/src/domain/feedback";
import { readJson, respond } from "../../../_lib/respond";

export async function PUT(request: Request, ctx: RouteContext<"/webapi/feedbacks/[id]/topics">) {
  const { id } = await ctx.params;
  return respond(async () => saveTopics(id, await readJson(request)));
}
