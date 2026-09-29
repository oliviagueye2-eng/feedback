import { refreshPublishedStats } from "@/src/domain/stats";
import { isAuthorizedCronCall } from "../../_lib/cron";
import { respond } from "../../_lib/respond";

/** Nightly job (vercel.json "crons"): recompute the published monthly results. */
export async function GET(request: Request) {
  if (!isAuthorizedCronCall(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  return respond(() => refreshPublishedStats());
}
