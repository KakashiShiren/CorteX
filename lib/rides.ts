import type { SupabaseClient } from "@supabase/supabase-js";

import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import type { AvatarColorPreset } from "@/lib/types";
import { getCurrentUserUniversityId as getUserUniversityId } from "@/lib/university";

export type RidePostType = "driver" | "passenger";
export type RideMatchStatus = "pending" | "approved" | "rejected" | "completed";

export interface RidePostAuthor {
  id: string;
  name: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
}

export interface RidePost {
  id: string;
  userId: string;
  universityId?: string;
  postType: RidePostType;
  departureLocation?: string;
  destination?: string;
  departureTime?: string;
  seatsAvailable?: number;
  costPerSeat?: number;
  flexibleTiming: boolean;
  description?: string;
  imageUrl?: string;
  isRecurring: boolean;
  recurringDays?: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: RidePostAuthor;
  likesCount: number;
  commentsCount: number;
}

export type RidePostRow = {
  id: string;
  user_id: string;
  university_id: string | null;
  post_type: string;
  departure_location: string | null;
  destination: string | null;
  departure_time: string | null;
  seats_available: number | null;
  cost_per_seat: number | string | null;
  flexible_timing: boolean | null;
  description: string | null;
  image_url: string | null;
  is_recurring: boolean | null;
  recurring_days: string | null;
  status: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type RideAuthorRow = {
  id: string;
  name: string;
  major: string | null;
  year: string | null;
  profile_picture_url: string | null;
};

export const ridePostSelect =
  "id, user_id, university_id, post_type, departure_location, destination, departure_time, seats_available, cost_per_seat, flexible_timing, description, image_url, is_recurring, recurring_days, status, expires_at, created_at, updated_at";

const rideAuthorSelect = "id, name, major, year, profile_picture_url";

export function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

export function isRidePostType(value: string | null | undefined): value is RidePostType {
  return value === "driver" || value === "passenger";
}

export async function getCurrentUserUniversityId(supabase: SupabaseClient, userId: string) {
  return getUserUniversityId(supabase, userId);
}

export async function hydrateRidePosts(supabase: SupabaseClient, rows: RidePostRow[]): Promise<RidePost[]> {
  if (!rows.length) {
    return [];
  }

  const authorIds = [...new Set(rows.map((row) => row.user_id))];
  const authorsQuery = await supabase.from("users").select(rideAuthorSelect).in("id", authorIds);

  if (authorsQuery.error) {
    throw new Error(authorsQuery.error.message);
  }

  const authorMap = new Map(
    ((authorsQuery.data ?? []) as RideAuthorRow[]).map((row) => {
      const avatar = parseAvatarProfilePicture(row.profile_picture_url);

      return [
        row.id,
        {
          id: row.id,
          name: row.name,
          major: row.major ?? undefined,
          year: row.year ?? undefined,
          profilePictureUrl: avatar.profilePictureUrl,
          avatarColor: avatar.avatarColor
        } satisfies RidePostAuthor
      ];
    })
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    universityId: row.university_id ?? undefined,
    postType: isRidePostType(row.post_type) ? row.post_type : "driver",
    departureLocation: row.departure_location ?? undefined,
    destination: row.destination ?? undefined,
    departureTime: normalizeTimestamp(row.departure_time),
    seatsAvailable: row.seats_available ?? undefined,
    costPerSeat: row.cost_per_seat === null ? undefined : Number(row.cost_per_seat),
    flexibleTiming: Boolean(row.flexible_timing),
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    isRecurring: Boolean(row.is_recurring),
    recurringDays: row.recurring_days ?? undefined,
    status: row.status ?? "active",
    expiresAt: normalizeTimestamp(row.expires_at) ?? null,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updated_at) ?? new Date().toISOString(),
    author:
      authorMap.get(row.user_id) ??
      ({
        id: row.user_id,
        name: "Grove student"
      } satisfies RidePostAuthor),
    likesCount: 0,
    commentsCount: 0
  }));
}

export function getRideExpiry(postType: RidePostType, departureTime?: Date | null) {
  if (departureTime && !Number.isNaN(departureTime.getTime())) {
    return departureTime.toISOString();
  }

  if (postType === "passenger") {
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  }

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}
