import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { ensureAuthEmailConfirmed } from "@/lib/auth-verification";
import { formatVerificationSendError, sendEmailVerificationChallenge } from "@/lib/email-verification";
import { fail } from "@/lib/http";
import { authenticateUser } from "@/lib/repository";
import { mapUserRow, UserRow } from "@/lib/supabase/mappers";
import { getSupabaseAnonClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { ensureWhitelistedTestAccount } from "@/lib/test-account-provisioning";
import { isWhitelistedTestEmail, TEST_ACCOUNT_PASSWORD } from "@/lib/test-accounts";
import { getCurrentUserUniversity } from "@/lib/university";
import { signInSchema } from "@/lib/validators";

const userProfileSelect =
  "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at";

function isSupabaseConnectionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as { message?: unknown; name?: unknown; cause?: unknown; code?: unknown };
  const cause = errorLike.cause instanceof Error ? errorLike.cause : null;
  const message = [
    typeof errorLike.name === "string" ? errorLike.name : "",
    typeof errorLike.message === "string" ? errorLike.message : "",
    typeof errorLike.code === "string" ? errorLike.code : "",
    cause?.message ?? ""
  ]
    .join(" ")
    .toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("authretryablefetcherror") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network") ||
    message.includes("supabase.co")
  );
}

function supabaseUnavailableResponse() {
  return fail(
    "Live sign in is unavailable because Supabase cannot be reached from this dev server.",
    503
  );
}

function demoSignInResponse(user: NonNullable<ReturnType<typeof authenticateUser>>) {
  const response = NextResponse.json({
    success: true,
    data: {
      user,
      session: {
        email: user.email,
        userId: user.id,
        demoMode: true
      }
    }
  });

  setSessionCookie(response, user);
  return response;
}

async function enrichUser(
  user: ReturnType<typeof mapUserRow>,
  supabaseService: NonNullable<ReturnType<typeof getSupabaseServiceClient>>
) {
  const university = await getCurrentUserUniversity(supabaseService, user.id);

  return {
    ...user,
    universityName: university.universityName ?? user.universityName,
    universityDomain: university.universityDomain ?? user.universityDomain
  };
}

async function buildVerificationRequiredResponse(
  user: ReturnType<typeof mapUserRow>,
  supabaseService: NonNullable<ReturnType<typeof getSupabaseServiceClient>>
) {
  const enrichedUser = await enrichUser(user, supabaseService);
  const response = fail("We sent a fresh verification code to your university inbox.", 403, {
    verificationRequired: true,
    email: enrichedUser.email,
    universityName: enrichedUser.universityName
  });
  setSessionCookie(response, enrichedUser);

  try {
    await sendEmailVerificationChallenge(response, {
      email: enrichedUser.email,
      name: enrichedUser.name
    });
  } catch (verificationError) {
    const failureResponse = fail(formatVerificationSendError(verificationError), 502, {
      verificationRequired: true,
      email: enrichedUser.email,
      universityName: enrichedUser.universityName,
      resendFailed: true
    });
    setSessionCookie(failureResponse, enrichedUser);
    return failureResponse;
  }

  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid sign in payload");
    }

    const supabaseAuth = getSupabaseAnonClient();
    const supabaseService = getSupabaseServiceClient();

    if (!supabaseAuth || !supabaseService) {
      return fail("Supabase is not configured for sign in.", 500);
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const demoUser = authenticateUser(email, password);

    if (demoUser) {
      return demoSignInResponse(demoUser);
    }

    if (isWhitelistedTestEmail(email) && password === TEST_ACCOUNT_PASSWORD) {
      const user = await ensureWhitelistedTestAccount(supabaseService, { email });
      const response = NextResponse.json({
        success: true,
        data: {
          user,
          session: {
            email: user.email,
            userId: user.id
          }
        }
      });

      setSessionCookie(response, user);
      return response;
    }

    let authResult = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authResult.error || !authResult.data.user) {
      if (isSupabaseConnectionError(authResult.error)) {
        return supabaseUnavailableResponse();
      }

      const loweredMessage = authResult.error?.message?.toLowerCase() ?? "";

      if (loweredMessage.includes("confirm")) {
        const profileQuery = await supabaseService
          .from("users")
          .select(userProfileSelect)
          .eq("email", email)
          .maybeSingle();

        if (profileQuery.error && profileQuery.error.code !== "PGRST116") {
          return fail(profileQuery.error.message, 500);
        }

        if (profileQuery.data) {
          const user = mapUserRow(profileQuery.data as UserRow);

          if (user.isVerified) {
            await ensureAuthEmailConfirmed(supabaseService, {
              email: user.email,
              name: user.name
            });

            authResult = await supabaseAuth.auth.signInWithPassword({
              email,
              password
            });

            if (!authResult.error && authResult.data.user) {
              const enrichedUser = await enrichUser(user, supabaseService);
              const response = NextResponse.json({
                success: true,
                data: {
                  user: enrichedUser,
                  session: {
                    email: enrichedUser.email,
                    userId: enrichedUser.id
                  }
                }
              });

              setSessionCookie(response, enrichedUser);
              return response;
            }
          } else {
            return buildVerificationRequiredResponse(user, supabaseService);
          }
        }
      }

      return fail(authResult.error?.message ?? "Incorrect email or password", 401);
    }

    let userQuery = await supabaseService
      .from("users")
      .select(userProfileSelect)
      .eq("id", authResult.data.user.id)
      .single();

    if (userQuery.error) {
      return fail("Signed in to Supabase Auth, but no matching users profile was found.", 500);
    }

    let user = mapUserRow(userQuery.data as UserRow);

    if (authResult.data.user.email_confirmed_at && !user.isVerified) {
      await ensureAuthEmailConfirmed(supabaseService, {
        email: user.email,
        name: user.name
      });

      const syncUser = await supabaseService
        .from("users")
        .update({
          is_verified: true
        })
        .eq("id", user.id)
        .select(userProfileSelect)
        .single();

      if (syncUser.error) {
        return fail(syncUser.error.message, 500);
      }

      const syncStudent = await supabaseService
        .from("students")
        .update({
          is_verified: true
        })
        .eq("user_id", user.id);

      if (syncStudent.error) {
        return fail(syncStudent.error.message, 500);
      }

      user = mapUserRow(syncUser.data as UserRow);
    }

    if (!user.isVerified) {
      return buildVerificationRequiredResponse(user, supabaseService);
    }

    const enrichedUser = await enrichUser(user, supabaseService);
    const response = NextResponse.json({
      success: true,
      data: {
        user: enrichedUser,
        session: {
          email: enrichedUser.email,
          userId: enrichedUser.id
        }
      }
    });

    setSessionCookie(response, enrichedUser);
    return response;
  } catch (error) {
    console.error("[auth/signin] Failed to sign in.", error);

    if (isSupabaseConnectionError(error)) {
      return supabaseUnavailableResponse();
    }

    return fail(error instanceof Error ? error.message : "Failed to sign in");
  }
}
