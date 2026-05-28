import { fail, ok, requireUserId } from "@/lib/http";
import {
  allowedPostTypes,
  getCurrentUserUniversityId,
  hydrateFeedPosts,
  isAllowedPostType,
  postSelect,
  type PostRow
} from "@/lib/posts";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedExpiryMinutes = new Set([60, 360, 720, 1440, 4320, 10080]);

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function normalizePostPayload(body: Partial<{
  content: string;
  post_type: string;
  event_date: string | null;
  event_location: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  expiry_minutes: number | string | null;
}>) {
  const content = body.content?.trim() ?? "";
  const postType = isAllowedPostType(body.post_type) ? body.post_type : null;
  const eventDate = body.event_date?.trim() ? new Date(body.event_date) : null;
  const eventLocation = body.event_location?.trim() || null;
  const imageUrl = body.image_url?.trim() || null;
  const hasExpiryMinutes = Object.prototype.hasOwnProperty.call(body, "expiry_minutes");
  const expiryMinutes =
    hasExpiryMinutes && body.expiry_minutes !== null && body.expiry_minutes !== undefined
      ? Number(body.expiry_minutes)
      : null;

  if (!content) {
    return { error: "Write something before you post." };
  }

  if (content.length > 500) {
    return { error: "Posts can be at most 500 characters." };
  }

  if (!postType || !allowedPostTypes.includes(postType)) {
    return { error: "Choose a valid post type." };
  }

  if ((postType === "event" || postType === "party" || postType === "trip") && !eventDate) {
    return { error: "Add a date and time for events, parties, and trips." };
  }

  if (eventDate && Number.isNaN(eventDate.getTime())) {
    return { error: "Choose a valid event date." };
  }

  if (hasExpiryMinutes && expiryMinutes !== null && (!Number.isFinite(expiryMinutes) || !allowedExpiryMinutes.has(expiryMinutes))) {
    return { error: "Choose a valid post expiry." };
  }

  return {
    content,
    postType,
    eventDate,
    eventLocation,
    imageUrl,
    isAnonymous: Boolean(body.is_anonymous),
    expiryMinutes,
    hasExpiryMinutes
  };
}

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for posts.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 500);
    const limit = parsePositiveInt(searchParams.get("limit"), 15, 30);
    const typeParam = searchParams.get("type");
    const postId = searchParams.get("id")?.trim();

    if (typeParam && !isAllowedPostType(typeParam)) {
      return fail("Choose a valid post filter.");
    }

    if (postId) {
      const singleQuery = await supabase
        .from("posts")
        .select(postSelect)
        .eq("id", postId)
        .eq("university_id", universityId)
        .or("expires_at.is.null,expires_at.gt.now()")
        .maybeSingle();

      if (singleQuery.error) {
        return fail(singleQuery.error.message, 500);
      }

      if (!singleQuery.data) {
        return fail("Post not found.", 404);
      }

      const [post] = await hydrateFeedPosts(supabase, userId, [singleQuery.data as PostRow]);
      return ok(post);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let postsQuery = supabase
      .from("posts")
      .select(postSelect, { count: "exact" })
      .eq("university_id", universityId)
      .or("expires_at.is.null,expires_at.gt.now()");

    if (typeParam) {
      postsQuery = postsQuery.eq("post_type", typeParam);
    }

    const result = await postsQuery.order("created_at", { ascending: false }).range(from, to);

    if (result.error) {
      return fail(result.error.message, 500);
    }

    const posts = await hydrateFeedPosts(supabase, userId, (result.data ?? []) as PostRow[]);
    const total = result.count ?? posts.length;

    return ok({
      posts,
      hasMore: total > from + posts.length,
      total
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load posts",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for posts.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      content: string;
      post_type: string;
      event_date: string | null;
      event_location: string | null;
      image_url: string | null;
      is_anonymous: boolean;
      expiry_minutes: number | string | null;
    }>;
    const parsed = normalizePostPayload(body);

    if ("error" in parsed && parsed.error) {
      return fail(parsed.error);
    }

    const expiresAt = parsed.hasExpiryMinutes
      ? parsed.expiryMinutes === null
        ? null
        : new Date(Date.now() + parsed.expiryMinutes * 60 * 1000).toISOString()
      : parsed.eventDate
        ? new Date(parsed.eventDate.getTime() + 6 * 60 * 60 * 1000).toISOString()
        : null;
    const insertQuery = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        university_id: universityId,
        content: parsed.content,
        post_type: parsed.postType,
        event_date: parsed.eventDate?.toISOString() ?? null,
        event_location: parsed.eventLocation,
        image_url: parsed.imageUrl,
        is_anonymous: parsed.isAnonymous,
        expires_at: expiresAt
      })
      .select(postSelect)
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [post] = await hydrateFeedPosts(supabase, userId, [insertQuery.data as PostRow]);
    return ok(post, { status: 201 });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create post",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
