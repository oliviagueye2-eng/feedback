import { listQrPosters } from "@/src/domain/admin";
import { requireAdmin } from "../../../../_lib/auth";
import { qrSvg } from "../../../../_lib/qrSvg";

/** The QR code alone, as an SVG file (for a printer or a designer); ?logo=1 adds the logo in the middle. */
export async function GET(request: Request, ctx: RouteContext<"/console-bo/qr-codes/svg/[code]">) {
  await requireAdmin();
  const { code } = await ctx.params;
  const [poster] = await listQrPosters([code]);
  if (!poster) return new Response("QR code not found or inactive", { status: 404 });
  const logo = new URL(request.url).searchParams.get("logo") === "1";
  return new Response(qrSvg(poster.code, { logo }), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="neexnaxari-qr-${poster.code}.svg"`,
      "Cache-Control": "private, no-store",
    },
  });
}
