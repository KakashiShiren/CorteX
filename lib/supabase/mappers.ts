import { Student, UserProfile, UserStatus } from "@/lib/types";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  major: string | null;
  year: string | null;
  residence: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  interests: string[] | null;
  is_verified: boolean;
  is_online: boolean;
  searchable: boolean;
  show_major: boolean;
  show_year: boolean;
  show_residence: boolean;
  show_interests: boolean;
  show_online_status: boolean;
  message_permission: "anyone" | "connected" | "none";
  blocked_users: string[] | null;
  created_at: string;
  updated_at: string;
};

export type StudentRow = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  major: string | null;
  year: string | null;
  residence: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  interests: string[] | null;
  is_verified: boolean;
  is_online: boolean;
  current_status: unknown;
  created_at: string;
  updated_at: string;
};

export type StatusRow = {
  id: string;
  user_id: string;
  activity: UserStatus["activity"];
  emoji: string | null;
  location: string | null;
  custom_text: string | null;
  is_visible: boolean;
  created_at: string;
  expires_at: string;
};

const defaultNotifications = {
  messages: true,
  digest: "immediately" as const,
  sounds: true,
  connectionRequests: true,
  campusAlerts: true,
  emailDigests: false
};

const defaultAppearance = {
  theme: "auto" as const,
  compactMode: false,
  fontScale: "md" as const
};

function getDefaultProfileFields() {
  return {
    major: "Undeclared",
    year: "Freshman",
    residence: "Off Campus",
    bio: "New to Cortex.",
    interests: [] as string[]
  };
}

function normalizeTimestamp(value: string | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  // Supabase/PostgREST can return timestamptz values without an explicit offset.
  // Treat those values as UTC so the browser doesn't reinterpret them as local time.
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

export function mapStatusRow(row: StatusRow): UserStatus {
  return {
    id: row.id,
    userId: row.user_id,
    activity: row.activity,
    emoji: row.emoji ?? "",
    location: row.location ?? undefined,
    customText: row.custom_text ?? undefined,
    isVisible: row.is_visible,
    createdAt: normalizeTimestamp(row.created_at),
    expiresAt: normalizeTimestamp(row.expires_at)
  };
}

export function normalizeCurrentStatus(value: unknown): UserStatus | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const status = value as Partial<UserStatus> & {
    user_id?: string;
    custom_text?: string;
    duration_minutes?: number;
    is_visible?: boolean;
    created_at?: string;
    expires_at?: string;
  };

  const normalized: UserStatus = {
    id: typeof status.id === "string" ? status.id : "",
    userId:
      typeof status.userId === "string"
        ? status.userId
        : typeof status.user_id === "string"
          ? status.user_id
          : "",
    activity: (status.activity as UserStatus["activity"]) ?? "idle",
    emoji: typeof status.emoji === "string" ? status.emoji : "",
    location: typeof status.location === "string" ? status.location : undefined,
    customText:
      typeof status.customText === "string"
        ? status.customText
        : typeof status.custom_text === "string"
          ? status.custom_text
          : undefined,
    durationMinutes:
      typeof status.durationMinutes === "number"
        ? status.durationMinutes
        : typeof status.duration_minutes === "number"
          ? status.duration_minutes
          : undefined,
    isVisible:
      typeof status.isVisible === "boolean"
        ? status.isVisible
        : typeof status.is_visible === "boolean"
          ? status.is_visible
          : true,
    createdAt:
      typeof status.createdAt === "string"
        ? normalizeTimestamp(status.createdAt)
        : typeof status.created_at === "string"
          ? normalizeTimestamp(status.created_at)
          : new Date().toISOString(),
    expiresAt:
      typeof status.expiresAt === "string"
        ? normalizeTimestamp(status.expiresAt)
        : typeof status.expires_at === "string"
          ? normalizeTimestamp(status.expires_at)
          : new Date().toISOString()
  };

  if (!normalized.id || !normalized.userId || !normalized.isVisible) {
    return undefined;
  }

  if (new Date(normalized.expiresAt).getTime() <= Date.now()) {
    return undefined;
  }

  return normalized;
}

export function mapUserRow(row: UserRow): UserProfile {
  const defaults = getDefaultProfileFields();

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    major: row.major ?? defaults.major,
    year: row.year ?? defaults.year,
    residence: row.residence ?? defaults.residence,
    bio: row.bio ?? defaults.bio,
    profilePictureUrl: row.profile_picture_url ?? undefined,
    interests: row.interests ?? defaults.interests,
    isVerified: row.is_verified,
    isOnline: row.is_online,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    privacy: {
      searchable: row.searchable,
      showMajor: row.show_major,
      showYear: row.show_year,
      showResidence: row.show_residence,
      showInterests: row.show_interests,
      showOnlineStatus: row.show_online_status,
      messagePermission: row.message_permission,
      blockedUsers: row.blocked_users ?? []
    },
    notifications: defaultNotifications,
    appearance: defaultAppearance
  };
}

export function mapStudentRow(
  row: StudentRow,
  connectionStatus?: Student["connectionStatus"]
): Student {
  const defaults = getDefaultProfileFields();

  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    major: row.major ?? defaults.major,
    year: row.year ?? defaults.year,
    residence: row.residence ?? defaults.residence,
    bio: row.bio ?? defaults.bio,
    profilePictureUrl: row.profile_picture_url ?? undefined,
    interests: row.interests ?? defaults.interests,
    isVerified: row.is_verified,
    isOnline: row.is_online,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    privacy: {
      searchable: true,
      showMajor: true,
      showYear: true,
      showResidence: true,
      showInterests: true,
      showOnlineStatus: true,
      messagePermission: "connected",
      blockedUsers: []
    },
    notifications: defaultNotifications,
    appearance: defaultAppearance,
    currentStatus: normalizeCurrentStatus(row.current_status),
    connectionStatus
  };
}
