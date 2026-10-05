import { NextResponse, type NextRequest } from "next/server";
import { LANDING_PATH, routeRequest } from "./src/lib/landing";

/**
 * Pre-launch routing (src/lib/landing.ts): the main domain shows the landing
 * page only; the test address keeps the whole site, hidden from search engines.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  switch (routeRequest(request.headers.get("host"), pathname)) {
    case "landing":
      return NextResponse.rewrite(new URL(LANDING_PATH, request.url));
    case "to-landing":
      return NextResponse.redirect(new URL("/", request.url));
    case "site": {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex");
      return response;
    }
  }
}

export const config = {
  // Pages only: not Next.js files, the API (the nightly cron) nor files with an
  // extension (logo, images, icons).
  matcher: ["/((?!_next/|webapi/|.*\\.).*)"],
};
