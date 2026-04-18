import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { UserProfile } from "@/lib/types";

export const SESSION_COOKIE = "cortex-session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function encodeSession(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !isUuid(payload.userId)
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function isValidSessionCookieValue(value?: string | null) {
  return Boolean(value && decodeSession(value));
}

export function getSession() {
  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!value) {
    return null;
  }

  return decodeSession(value);
}

export function getSessionUserId() {
  return getSession()?.userId ?? null;
}

export function setSessionCookie(response: NextResponse, user: UserProfile) {
  response.cookies.set(SESSION_COOKIE, encodeSession({
    userId: user.id,
    email: user.email,
    name: user.name
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
