import type { SupabaseClient, User } from "@supabase/supabase-js";

import { mapUserRow, type UserRow } from "@/lib/supabase/mappers";
import { findAuthUserByEmail } from "@/lib/test-account-provisioning";
import type { UserProfile } from "@/lib/types";
import { detectOrCreateUniversity, isAllowedUniversityEmail } from "@/lib/university";

const userProfileSelect =
  "id, email, name, university_id, major, year, residence, bio, profile_picture_url, interests, is_verified, is_online, searchable, show_major, show_year, show_residence, show_interests, show_online_status, message_permission, blocked_users, created_at, updated_at";

export type VerificationSyncErrorCode = "missing-account" | "invalid-domain" | "not-confirmed" | "profile-sync";

export class VerificationSyncError extends Error {
  code: VerificationSyncErrorCode;
  email?: string;

  constructor(code: VerificationSyncErrorCode, email?: string) {
    super(code);
    this.name = "VerificationSyncError";
    this.code = code;
    this.email = email;
  }
}

function buildDefaultUserProfile(userId: string, email: string, name: string, universityId: string | null) {
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

function buildDefaultStudentProfile(userId: string, email: string, name: string, universityId: string | null) {
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

export async function ensureAuthEmailConfirmed(
  supabaseService: SupabaseClient,
  {
    email,
    name
  }: {
    email: string;
    name?: string;
  }
) {
  const normalizedEmail = email.trim().toLowerCase();
  const authUser = await findAuthUserByEmail(supabaseService, normalizedEmail);

  if (!authUser) {
    throw new VerificationSyncError("missing-account", normalizedEmail);
  }

  if (authUser.email_confirmed_at) {
    return authUser;
  }

  const updateResult = await supabaseService.auth.admin.updateUserById(authUser.id, {
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: {
      ...(authUser.user_metadata ?? {}),
      ...(name ? { name } : {})
    }
  });

  if (updateResult.error || !updateResult.data.user) {
    throw new VerificationSyncError("profile-sync", normalizedEmail);
  }

  return updateResult.data.user;
}

export async function syncVerifiedAuthUser(supabaseService: SupabaseClient, authUser: User): Promise<UserProfile> {
  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new VerificationSyncError("missing-account");
  }

  if (!isAllowedUniversityEmail(email)) {
    throw new VerificationSyncError("invalid-domain", email);
  }

  if (!authUser.email_confirmed_at) {
    throw new VerificationSyncError("not-confirmed", email);
  }

  const name =
    typeof authUser.user_metadata?.name === "string" && authUser.user_metadata.name.trim().length > 1
      ? authUser.user_metadata.name.trim()
      : email.split("@")[0];
  const university = await detectOrCreateUniversity(email, supabaseService);

  let userQuery = await supabaseService
    .from("users")
    .update({
      email,
      is_verified: true,
      university_id: university.universityId
    })
    .eq("id", authUser.id)
    .select(userProfileSelect)
    .maybeSingle();

  if (userQuery.error) {
    throw new VerificationSyncError("profile-sync", email);
  }

  if (!userQuery.data) {
    userQuery = await supabaseService
      .from("users")
      .insert(buildDefaultUserProfile(authUser.id, email, name, university.universityId))
      .select(userProfileSelect)
      .single();

    if (userQuery.error) {
      throw new VerificationSyncError("profile-sync", email);
    }
  }

  const studentUpdate = await supabaseService
    .from("students")
    .update({
      email,
      is_verified: true,
      university_id: university.universityId
    })
    .eq("user_id", authUser.id)
    .select("user_id")
    .maybeSingle();

  if (studentUpdate.error) {
    throw new VerificationSyncError("profile-sync", email);
  }

  if (!studentUpdate.data) {
    const studentInsert = await supabaseService
      .from("students")
      .insert(buildDefaultStudentProfile(authUser.id, email, name, university.universityId));

    if (studentInsert.error) {
      throw new VerificationSyncError("profile-sync", email);
    }
  }

  return {
    ...mapUserRow(userQuery.data as UserRow),
    universityName: university.universityName,
    universityDomain: university.universityDomain
  };
}

export async function markUserEmailVerified(supabaseService: SupabaseClient, email: string): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isAllowedUniversityEmail(normalizedEmail)) {
    throw new VerificationSyncError("invalid-domain", normalizedEmail);
  }

  const existingUser = await supabaseService
    .from("users")
    .select(userProfileSelect)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUser.error) {
    throw new VerificationSyncError("profile-sync", normalizedEmail);
  }

  if (!existingUser.data) {
    throw new VerificationSyncError("missing-account", normalizedEmail);
  }

  const existingProfile = existingUser.data as UserRow;
  const university = await detectOrCreateUniversity(normalizedEmail, supabaseService);
  await ensureAuthEmailConfirmed(supabaseService, {
    email: normalizedEmail,
    name: existingProfile.name
  });

  if (existingProfile.is_verified) {
    return {
      ...mapUserRow(existingProfile),
      universityName: university.universityName,
      universityDomain: university.universityDomain
    };
  }

  const userUpdate = await supabaseService
    .from("users")
    .update({
      is_verified: true,
      university_id: university.universityId
    })
    .eq("id", existingUser.data.id)
    .select(userProfileSelect)
    .single();

  if (userUpdate.error) {
    throw new VerificationSyncError("profile-sync", normalizedEmail);
  }

  const studentUpdate = await supabaseService
    .from("students")
    .update({
      is_verified: true,
      university_id: university.universityId
    })
    .eq("user_id", existingUser.data.id);

  if (studentUpdate.error) {
    throw new VerificationSyncError("profile-sync", normalizedEmail);
  }

  return {
    ...mapUserRow(userUpdate.data as UserRow),
    universityName: university.universityName,
    universityDomain: university.universityDomain
  };
}
