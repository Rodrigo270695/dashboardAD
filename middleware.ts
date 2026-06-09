import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

import { type SessionData, sessionOptions } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname === "/";

  if (!session.isLoggedIn && isProtectedRoute && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
