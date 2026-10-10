import { NextResponse, type NextRequest } from "next/server";
import { isIndexableHost } from "./src/lib/indexing";

/**
 * Every address shows the whole site; only neexnaqari.com may appear in search
 * results (src/lib/indexing.ts). The back-office is also marked noindex by its
 * own layout.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!isIndexableHost(request.headers.get("host"))) response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  // Pages only: not Next.js files, the API (the nightly cron) nor files with an
  // extension (logo, images, icons).
  matcher: ["/((?!_next/|webapi/|.*\\.).*)"],
};
