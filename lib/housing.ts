import type { SupabaseClient } from "@supabase/supabase-js";

import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import type { AvatarColorPreset } from "@/lib/types";
import { getCurrentUserUniversityId as getUserUniversityId } from "@/lib/university";

export interface HousingAuthor {
  id: string;
  name: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
}

export interface HousingPost {
  id: string;
  userId: string;
  universityId?: string;
  title: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  pricePerMonth: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  amenities: string[];
  availableFrom?: string;
  leaseLength?: string;
  contactEmail?: string;
  contactPhone?: string;
  imagesUrl: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  author: HousingAuthor;
  commentsCount: number;
  likesCount: number;
  distanceMiles?: number;
}

export interface HousingComment {
  id: string;
  housingPostId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: HousingAuthor;
}

export type HousingPostRow = {
  id: string;
  user_id: string;
  university_id: string | null;
  title: string;
  description: string | null;
  location: string;
  latitude: number | string | null;
  longitude: number | string | null;
  price_per_month: number | string;
  bedrooms: number | null;
  bathrooms: number | string | null;
  square_feet: number | null;
  amenities: string[] | null;
  available_from: string | null;
  lease_length: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  images_url: string[] | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type HousingCommentRow = {
  id: string;
  housing_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type HousingAuthorRow = {
  id: string;
  name: string;
  major: string | null;
  year: string | null;
  profile_picture_url: string | null;
};

export const housingPostSelect =
  "id, user_id, university_id, title, description, location, latitude, longitude, price_per_month, bedrooms, bathrooms, square_feet, amenities, available_from, lease_length, contact_email, contact_phone, images_url, status, created_at, updated_at";

const housingAuthorSelect = "id, name, major, year, profile_picture_url";

function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function getCurrentUserUniversityId(supabase: SupabaseClient, userId: string) {
  return getUserUniversityId(supabase, userId);
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function buildAuthorMap(supabase: SupabaseClient, authorIds: string[]) {
  if (!authorIds.length) {
    return new Map<string, HousingAuthor>();
  }

  const authorsQuery = await supabase.from("users").select(housingAuthorSelect).in("id", authorIds);

  if (authorsQuery.error) {
    throw new Error(authorsQuery.error.message);
  }

  return new Map(
    ((authorsQuery.data ?? []) as HousingAuthorRow[]).map((row) => {
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
        } satisfies HousingAuthor
      ];
    })
  );
}

export async function hydrateHousingPosts(
  supabase: SupabaseClient,
  rows: HousingPostRow[],
  distances = new Map<string, number>()
): Promise<HousingPost[]> {
  if (!rows.length) {
    return [];
  }

  const authorMap = await buildAuthorMap(supabase, [...new Set(rows.map((row) => row.user_id))]);
  const postIds = rows.map((row) => row.id);
  const commentsQuery = await supabase
    .from("housing_comments")
    .select("housing_post_id")
    .in("housing_post_id", postIds);

  if (commentsQuery.error) {
    throw new Error(commentsQuery.error.message);
  }

  const commentCountMap = new Map<string, number>();
  for (const row of (commentsQuery.data ?? []) as Array<{ housing_post_id: string }>) {
    commentCountMap.set(row.housing_post_id, (commentCountMap.get(row.housing_post_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    universityId: row.university_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location,
    latitude: toOptionalNumber(row.latitude),
    longitude: toOptionalNumber(row.longitude),
    pricePerMonth: Number(row.price_per_month),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: toOptionalNumber(row.bathrooms),
    squareFeet: row.square_feet ?? undefined,
    amenities: row.amenities ?? [],
    availableFrom: row.available_from ?? undefined,
    leaseLength: row.lease_length ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    imagesUrl: row.images_url ?? [],
    status: row.status ?? "active",
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updated_at) ?? new Date().toISOString(),
    author:
      authorMap.get(row.user_id) ??
      ({
        id: row.user_id,
        name: "Grove student"
      } satisfies HousingAuthor),
    commentsCount: commentCountMap.get(row.id) ?? 0,
    likesCount: 0,
    distanceMiles: distances.get(row.id)
  }));
}

export async function hydrateHousingComments(
  supabase: SupabaseClient,
  rows: HousingCommentRow[]
): Promise<HousingComment[]> {
  if (!rows.length) {
    return [];
  }

  const authorMap = await buildAuthorMap(supabase, [...new Set(rows.map((row) => row.user_id))]);

  return rows.map((row) => ({
    id: row.id,
    housingPostId: row.housing_post_id,
    userId: row.user_id,
    content: row.content,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    author:
      authorMap.get(row.user_id) ??
      ({
        id: row.user_id,
        name: "Grove student"
      } satisfies HousingAuthor)
  }));
}
