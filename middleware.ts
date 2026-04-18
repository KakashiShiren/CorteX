import { NextRequest, NextResponse } from "next/server";

import { isValidSessionCookieValue, SESSION_COOKIE } from "@/lib/auth";

const protectedPrefixes = [
  "/dashboard",
  "/find-people",
  "/map",
  "/ai-chat",
  "/messages",
  "/settings"
];

const publicAuthPrefixes = ["/signin", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = isValidSessionCookieValue(sessionValue);

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublicAuth = publicAuthPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasSession) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(url);
    if (sessionValue) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if (isPublicAuth && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/find-people/:path*",
    "/map/:path*",
    "/ai-chat/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/signin",
    "/signup"
  ]
};
