import type { SupabaseClient } from "@supabase/supabase-js";

import { mapUserRow, type UserRow } from "@/lib/supabase/mappers";
import type { UserProfile } from "@/lib/types";
import {
  isWhitelistedTestEmail,
  normalizeCortexEmail,
  TEST_ACCOUNT_PASSWORD
} from "@/lib/test-accounts";
import { detectOrCreateUniversity } from "@/lib/university";

const userProfileSelect =
  "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at";

function buildUserProfilePayload(userId: string, email: string, name: string, universityId: string | null) {
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
    is_verified: true,
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

function buildStudentProfilePayload(userId: string, email: string, name: string, universityId: string | null) {
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
    is_verified: true,
    is_online: false,
    current_status: null
  };
}

export async function findAuthUserByEmail(supabaseService: SupabaseClient, email: string) {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const listResult = await supabaseService.auth.admin.listUsers({ page, perPage });

    if (listResult.error) {
      throw new Error(listResult.error.message);
    }

    const users = listResult.data?.users ?? [];
    const match = users.find((user) => user.email?.trim().toLowerCase() === email);
    if (match) {
      return match;
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function removeStaleProfileRows(supabaseService: SupabaseClient, email: string, userId: string) {
  const staleStudents = await supabaseService
    .from("students")
    .delete()
    .eq("email", email)
    .neq("user_id", userId);

  if (staleStudents.error) {
    throw new Error(staleStudents.error.message);
  }

  const staleUsers = await supabaseService.from("users").delete().eq("email", email).neq("id", userId);

  if (staleUsers.error) {
    throw new Error(staleUsers.error.message);
  }
}

export async function ensureWhitelistedTestAccount(
  supabaseService: SupabaseClient,
  {
    email,
    name
  }: {
    email: string;
    name?: string;
  }
): Promise<UserProfile> {
  const normalizedEmail = normalizeCortexEmail(email);

  if (!isWhitelistedTestEmail(normalizedEmail)) {
    throw new Error("That email is not a whitelisted Grove test account.");
  }

  const fallbackName = normalizedEmail.split("@")[0];
  const displayName = name?.trim() || fallbackName;
  const university = await detectOrCreateUniversity(normalizedEmail, supabaseService);

  let authUser = await findAuthUserByEmail(supabaseService, normalizedEmail);

  if (!authUser) {
    const createResult = await supabaseService.auth.admin.createUser({
      email: normalizedEmail,
      password: TEST_ACCOUNT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: displayName
      }
    });

    if (createResult.error || !createResult.data.user) {
      throw new Error(createResult.error?.message ?? "Failed to create the test auth account.");
    }

    authUser = createResult.data.user;
  } else {
    const updateResult = await supabaseService.auth.admin.updateUserById(authUser.id, {
      email: normalizedEmail,
      password: TEST_ACCOUNT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        name: displayName
      }
    });

    if (updateResult.error || !updateResult.data.user) {
      throw new Error(updateResult.error?.message ?? "Failed to update the test auth account.");
    }

    authUser = updateResult.data.user;
  }

  await removeStaleProfileRows(supabaseService, normalizedEmail, authUser.id);

  const userUpsert = await supabaseService
    .from("users")
    .upsert(buildUserProfilePayload(authUser.id, normalizedEmail, displayName, university.universityId), {
      onConflict: "id"
    })
    .select(userProfileSelect)
    .single();

  if (userUpsert.error) {
    throw new Error(userUpsert.error.message);
  }

  const studentUpsert = await supabaseService.from("students").upsert(
    buildStudentProfilePayload(authUser.id, normalizedEmail, displayName, university.universityId),
    {
      onConflict: "user_id"
    }
  );

  if (studentUpsert.error) {
    throw new Error(studentUpsert.error.message);
  }

  return {
    ...mapUserRow(userUpsert.data as UserRow),
    universityName: university.universityName,
    universityDomain: university.universityDomain
  } satisfies UserProfile;
}
