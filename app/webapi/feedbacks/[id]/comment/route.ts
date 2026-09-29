import { saveComment } from "@/src/domain/feedback";
import { readJson, respond } from "../../../_lib/respond";

export async function PUT(request: Request, ctx: RouteContext<"/webapi/feedbacks/[id]/comment">) {
  const { id } = await ctx.params;
  return respond(async () => saveComment(id, await readJson(request)));
}
