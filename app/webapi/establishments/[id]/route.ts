import { getEstablishment } from "@/src/domain/establishment";
import { respond } from "../../_lib/respond";

export async function GET(_request: Request, ctx: RouteContext<"/webapi/establishments/[id]">) {
  const { id } = await ctx.params;
  return respond(() => getEstablishment(id));
}
