import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Public: the login page, Auth.js's own routes (signin/callback/session/
// signout — these have to be reachable *before* someone is signed in),
// and the read-only /api/public/* routes apps/web calls to render the
// marketing site (no login needed to just view deal content). Everything
// else — the admin UI and the write routes under /api/deals,
// /api/site-settings — requires a signed-in, allowlisted session.
const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth", "/api/public", "/api/health"];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (request.auth) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
