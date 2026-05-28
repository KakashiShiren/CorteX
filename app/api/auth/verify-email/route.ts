import {
  getSession,
  getVerificationChallenge,
  setSessionCookie
} from "@/lib/auth";
import { clearEmailVerificationChallenge, formatVerificationSendError, isVerificationCodeValid, sendEmailVerificationChallenge } from "@/lib/email-verification";
import { markUserEmailVerified, VerificationSyncError } from "@/lib/auth-verification";
import { fail, ok } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isAllowedUniversityEmail } from "@/lib/university";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<{ email: string }>;
    const session = getSession();
    const sessionEmail = session && !session.isVerified ? session.email : undefined;
    const email = (sessionEmail ?? body.email ?? "").trim().toLowerCase();

    if (!email || !isAllowedUniversityEmail(email)) {
      return fail("Use your university email address to resend confirmation.");
    }

    const supabaseService = getSupabaseServiceClient();

    if (!supabaseService) {
      return fail("Supabase is not configured for email verification.", 500);
    }

    const pendingUser = await supabaseService
      .from("users")
      .select("id, is_verified")
      .eq("email", email)
      .maybeSingle();

    if (pendingUser.error && pendingUser.error.code !== "PGRST116") {
      return fail(pendingUser.error.message, 500);
    }

    if (!pendingUser.data) {
      return fail("We couldn't find a pending Grove account for that email.", 404);
    }

    if (pendingUser.data.is_verified) {
      return ok({
        message: "That email is already verified.",
        alreadyVerified: true,
        email
      });
    }

    const response = ok({
      message: `We sent another verification code to ${email}.`,
      email
    });

    try {
      await sendEmailVerificationChallenge(response, {
        email
      });
    } catch (verificationError) {
      return fail(formatVerificationSendError(verificationError), 502);
    }

    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to resend verification email", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<{ email: string; code: string }>;
    const email = (body.email ?? "").trim().toLowerCase();
    const code = (body.code ?? "").trim();

    if (!email || !isAllowedUniversityEmail(email)) {
      return fail("Use your supported university email address.");
    }

    if (!/^\d{6}$/.test(code)) {
      return fail("Enter the 6-digit verification code.");
    }

    const challenge = getVerificationChallenge();
    if (!isVerificationCodeValid(challenge, { email, code })) {
      return fail("That verification code is invalid or expired. Request a new code and try again.", 400);
    }

    const supabaseService = getSupabaseServiceClient();
    if (!supabaseService) {
      return fail("Supabase is not configured for email verification.", 500);
    }

    const user = await markUserEmailVerified(supabaseService, email);
    const response = ok({
      user,
      message: "Your university email is verified.",
      session: {
        email: user.email,
        userId: user.id
      }
    });

    setSessionCookie(response, user);
    clearEmailVerificationChallenge(response);
    return response;
  } catch (error) {
    if (error instanceof VerificationSyncError) {
      return fail("We couldn't finish verifying this Grove account. Request a new code and try again.", 400, {
        code: error.code,
        email: error.email
      });
    }

    return fail(error instanceof Error ? error.message : "Unable to verify email", 500);
  }
}
