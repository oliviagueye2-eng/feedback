import { getPublishedResults } from "@/src/domain/stats";
import { respond } from "../../../_lib/respond";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/webapi/establishments/[id]/stats">,
) {
  const { id } = await ctx.params;
  return respond(() => getPublishedResults(id));
}
