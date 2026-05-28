import type { SupabaseClient } from "@supabase/supabase-js";

import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import { ensureImageBucket } from "@/lib/storage";
import type { FeedComment, FeedPost, FeedPostRsvpStatus, FeedPostType, TrendingFeedPost } from "@/lib/types";
import { getCurrentUserUniversityId as getUserUniversityId } from "@/lib/university";

export const postSelect =
  "id, user_id, university_id, content, image_url, post_type, event_date, event_location, is_anonymous, expires_at, likes_count, comments_count, rsvp_going_count, created_at, updated_at";

export const postAuthorSelect = "id, name, major, year, profile_picture_url, university_id";

export const allowedPostTypes: FeedPostType[] = [
  "general",
  "event",
  "party",
  "trip",
  "lostfound",
  "rideshare",
  "shoutout"
];

export type PostRow = {
  id: string;
  user_id: string;
  university_id: string | null;
  content: string;
  image_url: string | null;
  post_type: string | null;
  event_date: string | null;
  event_location: string | null;
  is_anonymous: boolean | null;
  expires_at: string | null;
  likes_count: number | null;
  comments_count: number | null;
  rsvp_going_count: number | null;
  created_at: string;
  updated_at: string;
};

type PostAuthorRow = {
  id: string;
  name: string;
  major: string | null;
  year: string | null;
  profile_picture_url: string | null;
  university_id: string | null;
};

type PostReactionRow = {
  post_id: string;
  reaction: string | null;
};

type PostRsvpRow = {
  post_id: string;
  status: string | null;
};

type PostCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

export function isAllowedPostType(value: string | null | undefined): value is FeedPostType {
  return allowedPostTypes.includes((value ?? "") as FeedPostType);
}

export async function getCurrentUserUniversityId(supabase: SupabaseClient, userId: string) {
  return getUserUniversityId(supabase, userId);
}

export async function hydrateFeedPosts(
  supabase: SupabaseClient,
  currentUserId: string,
  postRows: PostRow[]
): Promise<FeedPost[]> {
  if (!postRows.length) {
    return [];
  }

  const postIds = [...new Set(postRows.map((row) => row.id))];
  const authorIds = [...new Set(postRows.map((row) => row.user_id))];

  const [authorsQuery, reactionsQuery, rsvpsQuery] = await Promise.all([
    supabase.from("users").select(postAuthorSelect).in("id", authorIds),
    supabase.from("post_reactions").select("post_id, reaction").eq("user_id", currentUserId).in("post_id", postIds),
    supabase.from("post_rsvps").select("post_id, status").eq("user_id", currentUserId).in("post_id", postIds)
  ]);

  if (authorsQuery.error) {
    throw new Error(authorsQuery.error.message);
  }

  if (reactionsQuery.error) {
    throw new Error(reactionsQuery.error.message);
  }

  if (rsvpsQuery.error) {
    throw new Error(rsvpsQuery.error.message);
  }

  const authorMap = new Map(
    ((authorsQuery.data ?? []) as PostAuthorRow[]).map((row) => {
      const avatar = parseAvatarProfilePicture(row.profile_picture_url);

      return [
        row.id,
        {
          id: row.id,
          name: row.name,
          universityId: row.university_id ?? undefined,
          major: row.major ?? undefined,
          year: row.year ?? undefined,
          profilePictureUrl: avatar.profilePictureUrl,
          avatarColor: avatar.avatarColor
        }
      ];
    })
  );
  const likedPostIds = new Set(
    ((reactionsQuery.data ?? []) as PostReactionRow[])
      .filter((row) => row.reaction === "like")
      .map((row) => row.post_id)
  );
  const rsvpStatusMap = new Map(
    ((rsvpsQuery.data ?? []) as PostRsvpRow[])
      .filter((row) => row.status === "going" || row.status === "not_interested")
      .map((row) => [row.post_id, row.status as FeedPostRsvpStatus])
  );

  return postRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    universityId: row.university_id ?? undefined,
    content: row.content,
    imageUrl: row.image_url ?? undefined,
    postType: isAllowedPostType(row.post_type) ? row.post_type : "general",
    eventDate: normalizeTimestamp(row.event_date),
    eventLocation: row.event_location ?? undefined,
    isAnonymous: Boolean(row.is_anonymous),
    expiresAt: normalizeTimestamp(row.expires_at) ?? null,
    likesCount: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    rsvpGoingCount: row.rsvp_going_count ?? 0,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updated_at) ?? new Date().toISOString(),
    author:
      authorMap.get(row.user_id) ??
      ({
        id: row.user_id,
        name: "Unknown student"
      } satisfies FeedPost["author"]),
    viewerHasLiked: likedPostIds.has(row.id),
    viewerRsvpStatus: rsvpStatusMap.get(row.id)
  }));
}

export async function hydrateFeedComments(
  supabase: SupabaseClient,
  commentRows: PostCommentRow[]
): Promise<FeedComment[]> {
  if (!commentRows.length) {
    return [];
  }

  const authorIds = [...new Set(commentRows.map((row) => row.user_id))];
  const authorsQuery = await supabase.from("users").select(postAuthorSelect).in("id", authorIds);

  if (authorsQuery.error) {
    throw new Error(authorsQuery.error.message);
  }

  const authorMap = new Map(
    ((authorsQuery.data ?? []) as PostAuthorRow[]).map((row) => {
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
        }
      ];
    })
  );

  return commentRows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString(),
    author:
      authorMap.get(row.user_id) ??
      ({
        id: row.user_id,
        name: "Unknown student"
      } satisfies FeedComment["author"])
  }));
}

export function mapTrendingFeedPost(row: PostRow): TrendingFeedPost {
  return {
    id: row.id,
    postType: isAllowedPostType(row.post_type) ? row.post_type : "general",
    content: row.content,
    eventLocation: row.event_location ?? undefined,
    likesCount: row.likes_count ?? 0,
    rsvpGoingCount: row.rsvp_going_count ?? 0,
    createdAt: normalizeTimestamp(row.created_at) ?? new Date().toISOString()
  };
}

export async function ensurePostsBucket(supabase: SupabaseClient) {
  return ensureImageBucket(supabase, "posts");
}
