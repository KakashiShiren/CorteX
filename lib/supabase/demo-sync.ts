import { SupabaseClient } from "@supabase/supabase-js";

import { demoConnections, demoStatuses, demoUsers } from "@/lib/demo-data";
import { ActivityType, UserProfile, UserStatus } from "@/lib/types";

type StatusRow = {
  id: string;
  user_id: string;
  activity: ActivityType;
  emoji: string | null;
  location: string | null;
  custom_text: string | null;
  is_visible: boolean;
  created_at: string;
  expires_at: string;
};

declare global {
  var __cortexSupabaseDemoSeeded: string | undefined;
}

function toUserRow(user: UserProfile) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    major: user.major,
    year: user.year,
    residence: user.residence,
    bio: user.bio,
    profile_picture_url: user.profilePictureUrl ?? null,
    interests: user.interests,
    is_verified: user.isVerified,
    is_online: user.isOnline,
    searchable: user.privacy.searchable,
    show_major: user.privacy.showMajor,
    show_year: user.privacy.showYear,
    show_residence: user.privacy.showResidence,
    show_interests: user.privacy.showInterests,
    show_online_status: user.privacy.showOnlineStatus,
    message_permission: user.privacy.messagePermission,
    blocked_users: user.privacy.blockedUsers,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

function toStudentRow(user: UserProfile) {
  return {
    id: user.id,
    user_id: user.id,
    email: user.email,
    name: user.name,
    major: user.major,
    year: user.year,
    residence: user.residence,
    bio: user.bio,
    profile_picture_url: user.profilePictureUrl ?? null,
    interests: user.interests,
    is_verified: user.isVerified,
    is_online: user.isOnline,
    current_status: null,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

function toStatusRow(status: UserStatus) {
  return {
    id: status.id,
    user_id: status.userId,
    activity: status.activity,
    emoji: status.emoji,
    location: status.location ?? null,
    custom_text: status.customText ?? null,
    is_visible: status.isVisible,
    created_at: status.createdAt,
    expires_at: status.expiresAt
  };
}

function toConnectionRow(connection: {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: string;
  respondedAt?: string;
}) {
  return {
    id: connection.id,
    from_user_id: connection.fromUserId,
    to_user_id: connection.toUserId,
    status: connection.status,
    created_at: connection.createdAt,
    responded_at: connection.respondedAt ?? null
  };
}

export function mapSupabaseStatusRow(row: StatusRow): UserStatus {
  return {
    id: row.id,
    userId: row.user_id,
    activity: row.activity,
    emoji: row.emoji ?? "",
    location: row.location ?? undefined,
    customText: row.custom_text ?? undefined,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

async function seedMissingStatuses(supabase: SupabaseClient) {
  const seedUserIds = demoStatuses.map((status) => status.userId);
  const existingQuery = await supabase
    .from("user_status")
    .select("user_id")
    .in("user_id", seedUserIds);

  if (existingQuery.error) {
    throw existingQuery.error;
  }

  const existingIds = new Set((existingQuery.data ?? []).map((row) => row.user_id as string));
  const missingStatuses = demoStatuses
    .filter((status) => !existingIds.has(status.userId))
    .map(toStatusRow);

  if (!missingStatuses.length) {
    return;
  }

  const insertQuery = await supabase.from("user_status").insert(missingStatuses);
  if (insertQuery.error) {
    throw insertQuery.error;
  }
}

export async function syncUserProfileToSupabase(supabase: SupabaseClient, user: UserProfile) {
  const userQuery = await supabase.from("users").upsert(toUserRow(user), { onConflict: "id" });
  if (userQuery.error) {
    throw userQuery.error;
  }

  const studentQuery = await supabase.from("students").upsert(toStudentRow(user), { onConflict: "id" });
  if (studentQuery.error) {
    throw studentQuery.error;
  }
}

export async function ensureSupabaseDemoData(supabase: SupabaseClient) {
  const seedKey = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "default";
  if (global.__cortexSupabaseDemoSeeded === seedKey) {
    return;
  }

  const usersQuery = await supabase.from("users").upsert(demoUsers.map(toUserRow), { onConflict: "id" });
  if (usersQuery.error) {
    throw usersQuery.error;
  }

  const studentsQuery = await supabase
    .from("students")
    .upsert(demoUsers.map(toStudentRow), { onConflict: "id" });
  if (studentsQuery.error) {
    throw studentsQuery.error;
  }

  const connectionsQuery = await supabase
    .from("connections")
    .upsert(demoConnections.map(toConnectionRow), { onConflict: "from_user_id,to_user_id" });
  if (connectionsQuery.error) {
    throw connectionsQuery.error;
  }

  await seedMissingStatuses(supabase);

  global.__cortexSupabaseDemoSeeded = seedKey;
}
