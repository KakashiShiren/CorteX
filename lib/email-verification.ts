import { createHash, randomInt, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { clearVerificationCookie, type VerificationPayload, setVerificationCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { sendVerificationCodeEmail } from "@/lib/mailer";

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getVerificationSecret() {
  return env.verificationCodeSecret ?? "grove-dev-verification-secret";
}

function hashVerificationCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${getVerificationSecret()}`)
    .digest("hex");
}

export function buildVerificationChallenge(email: string, code: string): VerificationPayload {
  const now = Date.now();

  return {
    email: normalizeEmail(email),
    codeHash: hashVerificationCode(email, code),
    expiresAt: new Date(now + VERIFICATION_CODE_TTL_MS).toISOString(),
    sentAt: new Date(now).toISOString()
  };
}

export function generateVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function sendEmailVerificationChallenge(
  response: NextResponse,
  {
    email,
    name
  }: {
    email: string;
    name?: string;
  }
) {
  const code = generateVerificationCode();
  const challenge = buildVerificationChallenge(email, code);

  await sendVerificationCodeEmail({
    email: challenge.email,
    code,
    name
  });

  setVerificationCookie(response, challenge);
  return challenge;
}

export function isVerificationCodeValid(
  challenge: VerificationPayload | null | undefined,
  {
    email,
    code
  }: {
    email: string;
    code: string;
  }
) {
  if (!challenge) {
    return false;
  }

  if (challenge.email !== normalizeEmail(email)) {
    return false;
  }

  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    return false;
  }

  const expectedHash = hashVerificationCode(email, code);

  return timingSafeEqual(Buffer.from(challenge.codeHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export function clearEmailVerificationChallenge(response: NextResponse) {
  clearVerificationCookie(response);
}

export function formatVerificationSendError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return "";
            }
          })();

  const loweredMessage = message.toLowerCase();

  if (!message || message === "{}" || loweredMessage.includes("smtp_not_configured")) {
    return "Grove email delivery is not configured yet. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL to the environment.";
  }

  if (loweredMessage.includes("invalid login") || loweredMessage.includes("auth")) {
    return "SMTP authentication failed. Double-check SMTP_USER and SMTP_PASS.";
  }

  if (
    loweredMessage.includes("timed out") ||
    loweredMessage.includes("timeout") ||
    loweredMessage.includes("greeting never received") ||
    loweredMessage.includes("econnrefused")
  ) {
    return "The SMTP server did not respond in time. Double-check SMTP_HOST and SMTP_PORT, and make sure the provider allows SMTP connections from this environment.";
  }

  if (loweredMessage.includes("sender") || loweredMessage.includes("from")) {
    return "The sender address was rejected by the SMTP provider. Use a verified sender for SMTP_FROM_EMAIL.";
  }

  return `Grove couldn't send the verification code: ${message}`;
}
