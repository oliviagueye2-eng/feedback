import { getEstablishmentByQrCode } from "@/src/domain/establishment";
import { respond } from "../../_lib/respond";

export async function GET(_request: Request, ctx: RouteContext<"/webapi/qr/[code]">) {
  const { code } = await ctx.params;
  return respond(() => getEstablishmentByQrCode(code));
}
