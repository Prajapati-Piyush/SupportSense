import { NextResponse, type NextRequest } from "next/server";
import { ROLE_COOKIE, SESSION_COOKIE } from "@/lib/session";
import { canAccess, homePathFor } from "@/lib/domain";
import type { UserRole } from "@/lib/types";

/**
 * §12 — role-based redirects. The API is the real boundary; this is UX so that
 * a signed-in agent never lands on a page they cannot use.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const userId = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value as UserRole | undefined;
  const authed = Boolean(userId && role);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(authed ? homePathFor(role!) : "/login", request.url));
  }

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL(homePathFor(role!), request.url));
    return NextResponse.next();
  }

  if (!authed) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!canAccess(role!, pathname)) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/portal/:path*", "/desk/:path*", "/admin/:path*", "/settings/:path*"],
};
