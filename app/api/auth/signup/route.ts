import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { formatVerificationSendError, sendEmailVerificationChallenge } from "@/lib/email-verification";
import { fail } from "@/lib/http";
import { mapUserRow, type UserRow } from "@/lib/supabase/mappers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  ensureWhitelistedTestAccount,
  findAuthUserByEmail,
  removeStaleProfileRows
} from "@/lib/test-account-provisioning";
import { isWhitelistedTestEmail, TEST_ACCOUNT_PASSWORD } from "@/lib/test-accounts";
import { detectOrCreateUniversity } from "@/lib/university";
import { signUpSchema } from "@/lib/validators";

const userProfileSelect =
  "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at";

function buildUserProfilePayload(
  userId: string,
  email: string,
  name: string,
  universityId: string,
  isVerified: boolean
) {
  return {
    id: userId,
    email,
    name,
    university_id: universityId,
    major: "Undeclared",
    year: "Freshman",
    residence: "Off Campus",
    bio: "New to Grove.",
    interests: [] as string[],
    is_verified: isVerified,
    is_online: false,
    searchable: true,
    show_major: true,
    show_year: true,
    show_residence: true,
    show_interests: true,
    show_online_status: true,
    message_permission: "connected" as const,
    blocked_users: [] as string[]
  };
}

function buildStudentProfilePayload(
  userId: string,
  email: string,
  name: string,
  universityId: string,
  isVerified: boolean
) {
  return {
    id: userId,
    user_id: userId,
    email,
    name,
    university_id: universityId,
    major: "Undeclared",
    year: "Freshman",
    residence: "Off Campus",
    bio: "New to Grove.",
    interests: [] as string[],
    is_verified: isVerified,
    is_online: false,
    current_status: null
  };
}

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid sign up payload");
    }

    const supabaseService = getSupabaseServiceClient();

    if (!supabaseService) {
      return fail("Supabase is not configured for sign up.", 500);
    }

    const email = parsed.data.email.toLowerCase();
    const name = parsed.data.name.trim();
    const university = await detectOrCreateUniversity(email, supabaseService);

    if (isWhitelistedTestEmail(email)) {
      if (parsed.data.password !== TEST_ACCOUNT_PASSWORD) {
        return fail(`Test accounts must use ${TEST_ACCOUNT_PASSWORD}`);
      }

      const user = await ensureWhitelistedTestAccount(supabaseService, { email, name });
      const response = NextResponse.json({
        success: true,
        data: {
          user,
          message: `Welcome to Grove at ${university.universityName}!`,
          verificationRequired: false,
          universityName: university.universityName,
          session: {
            email: user.email,
            userId: user.id
          }
        }
      });

      setSessionCookie(response, user);
      return response;
    }

    const existingProfile = await supabaseService
      .from("users")
      .select(userProfileSelect)
      .eq("email", email)
      .maybeSingle();

    if (existingProfile.error && existingProfile.error.code !== "PGRST116") {
      return fail(existingProfile.error.message, 500);
    }

    if (existingProfile.data && (existingProfile.data as UserRow).is_verified) {
      return fail("That email already has a Grove account. Sign in instead.", 409);
    }

    let authUser = await findAuthUserByEmail(supabaseService, email);

    if (authUser) {
      const authUpdate = await supabaseService.auth.admin.updateUserById(authUser.id, {
        email,
        password: parsed.data.password,
        email_confirm: Boolean(authUser.email_confirmed_at),
        user_metadata: {
          ...(authUser.user_metadata ?? {}),
          name
        }
      });

      if (authUpdate.error || !authUpdate.data.user) {
        return fail(authUpdate.error?.message ?? "Unable to update the existing auth account", 500);
      }

      authUser = authUpdate.data.user;
    } else {
      const authCreate = await supabaseService.auth.admin.createUser({
        email,
        password: parsed.data.password,
        email_confirm: false,
        user_metadata: {
          name
        }
      });

      if (authCreate.error || !authCreate.data.user) {
        return fail(authCreate.error?.message ?? "Unable to create your Grove account", 500);
      }

      authUser = authCreate.data.user;
      createdAuthUserId = authUser.id;
    }

    await removeStaleProfileRows(supabaseService, email, authUser.id);

    const isVerified = false;
    const userUpsert = await supabaseService
      .from("users")
      .upsert(buildUserProfilePayload(authUser.id, email, name, university.universityId, isVerified), {
        onConflict: "id"
      })
      .select(userProfileSelect)
      .single();

    if (userUpsert.error) {
      throw new Error(userUpsert.error.message);
    }

    const studentUpsert = await supabaseService.from("students").upsert(
      buildStudentProfilePayload(authUser.id, email, name, university.universityId, isVerified),
      {
        onConflict: "user_id"
      }
    );

    if (studentUpsert.error) {
      throw new Error(studentUpsert.error.message);
    }

    const user = {
      ...mapUserRow(userUpsert.data as UserRow),
      universityName: university.universityName,
      universityDomain: university.universityDomain
    };

    const response = NextResponse.json({
      success: true,
      data: {
        user,
        message: `Welcome to Grove at ${university.universityName}!`,
        verificationRequired: !isVerified,
        email: user.email,
        universityName: university.universityName
      }
    });

    if (!isVerified) {
      try {
        await sendEmailVerificationChallenge(response, {
          email: user.email,
          name: user.name
        });
      } catch (verificationError) {
        const failureResponse = fail(formatVerificationSendError(verificationError), 502, {
          verificationRequired: true,
          email,
          universityName: university.universityName,
          resendFailed: true
        });
        return failureResponse;
      }
    }

    return response;
  } catch (error) {
    console.error("[auth/signup] Failed to create account.", error);

    if (createdAuthUserId) {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        await supabase.from("users").delete().eq("id", createdAuthUserId);
        await supabase.from("students").delete().eq("user_id", createdAuthUserId);
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
    }

    return fail(error instanceof Error ? error.message : "Failed to create account");
  }
}
