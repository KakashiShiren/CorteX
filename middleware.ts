import { NextRequest, NextResponse } from "next/server";

import { parseSessionCookieValue, SESSION_COOKIE } from "@/lib/auth";

const protectedPrefixes = [
  "/feed",
  "/dashboard",
  "/find-people",
  "/students",
  "/connections",
  "/map",
  "/ai-chat",
  "/messages",
  "/settings"
];

const publicAuthPrefixes = ["/auth", "/signin", "/signup"];
const verificationPrefix = "/verify-email";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value;
  const session = parseSessionCookieValue(sessionValue);
  const hasSession = Boolean(session);

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublicAuth = publicAuthPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isVerifyEmail = pathname.startsWith(verificationPrefix);

  if (hasSession && session && !session.isVerified && (isProtected || isPublicAuth)) {
    const url = new URL(verificationPrefix, request.url);
    url.searchParams.set("email", session.email);
    return NextResponse.redirect(url);
  }

  if (isProtected && !hasSession) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(url);
    if (sessionValue) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if ((isPublicAuth || isVerifyEmail) && session?.isVerified) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/feed/:path*",
    "/find-people/:path*",
    "/students/:path*",
    "/connections/:path*",
    "/map/:path*",
    "/ai-chat/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/auth",
    "/signin",
    "/signup",
    "/verify-email"
  ]
};
