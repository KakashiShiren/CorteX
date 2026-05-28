import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { UserProfile } from "@/lib/types";
import { isAllowedUniversityEmail } from "@/lib/university";

export const SESSION_COOKIE = "grove-session";
export const VERIFICATION_COOKIE = "grove-verification";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  isVerified: boolean;
  universityName?: string;
  universityDomain?: string;
}

export interface VerificationPayload {
  email: string;
  codeHash: string;
  expiresAt: string;
  sentAt: string;
}

function isSessionUserId(value: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    /^user-\d+$/i.test(value)
  );
}

function encodeSession(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function encodeVerification(payload: VerificationPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !isSessionUserId(payload.userId)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      // Older cookies won't have this field; treat them as verified so existing
      // signed-in sessions are not unexpectedly forced through re-verification.
      isVerified: typeof payload.isVerified === "boolean" ? payload.isVerified : true,
      universityName: typeof payload.universityName === "string" ? payload.universityName : undefined,
      universityDomain: typeof payload.universityDomain === "string" ? payload.universityDomain : undefined
    };
  } catch {
    return null;
  }
}

function decodeVerification(value: string): VerificationPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<VerificationPayload>;

    if (
      typeof payload.email !== "string" ||
      !isAllowedUniversityEmail(payload.email) ||
      typeof payload.codeHash !== "string" ||
      !/^[a-f0-9]{64}$/i.test(payload.codeHash) ||
      typeof payload.expiresAt !== "string" ||
      Number.isNaN(Date.parse(payload.expiresAt)) ||
      typeof payload.sentAt !== "string" ||
      Number.isNaN(Date.parse(payload.sentAt))
    ) {
      return null;
    }

    return {
      email: payload.email.toLowerCase(),
      codeHash: payload.codeHash,
      expiresAt: payload.expiresAt,
      sentAt: payload.sentAt
    };
  } catch {
    return null;
  }
}

export function parseSessionCookieValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return decodeSession(value);
}

export function isValidSessionCookieValue(value?: string | null) {
  return Boolean(parseSessionCookieValue(value));
}

export function parseVerificationCookieValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return decodeVerification(value);
}

export function getSession() {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return parseSessionCookieValue(value);
}

export function getSessionUserId() {
  return getSession()?.userId ?? null;
}

export function getVerificationChallenge() {
  const value = cookies().get(VERIFICATION_COOKIE)?.value;
  return parseVerificationCookieValue(value);
}

export function setSessionCookie(response: NextResponse, user: UserProfile) {
  response.cookies.set(
    SESSION_COOKIE,
    encodeSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      universityName: user.universityName,
      universityDomain: user.universityDomain
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    }
  );
}

export function setVerificationCookie(response: NextResponse, payload: VerificationPayload) {
  response.cookies.set(VERIFICATION_COOKIE, encodeVerification(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
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

export function clearVerificationCookie(response: NextResponse) {
  response.cookies.set(VERIFICATION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

