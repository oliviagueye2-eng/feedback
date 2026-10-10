import { listQrPosters } from "@/src/domain/admin";
import { requireAdmin } from "../../../../_lib/auth";
import { qrSvg } from "../../../../_lib/qrSvg";

/** The QR code alone, as an SVG file (for a printer or a designer). */
export async function GET(_request: Request, ctx: RouteContext<"/console-bo/qr-codes/svg/[code]">) {
  await requireAdmin();
  const { code } = await ctx.params;
  const [poster] = await listQrPosters([code]);
  if (!poster) return new Response("QR code not found or inactive", { status: 404 });
  return new Response(qrSvg(poster.code), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="neexnaqari-qr-${poster.code}.svg"`,
      "Cache-Control": "private, no-store",
    },
  });
}
