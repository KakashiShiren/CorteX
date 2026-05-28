import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId, mapTrendingFeedPost, postSelect, type PostRow } from "@/lib/posts";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for trending posts.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const postsQuery = await supabase
      .from("posts")
      .select(postSelect)
      .eq("university_id", universityId)
      .gte("created_at", since)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(40);

    if (postsQuery.error) {
      return fail(postsQuery.error.message, 500);
    }

    const posts = ((postsQuery.data ?? []) as PostRow[])
      .sort(
        (left, right) =>
          (right.rsvp_going_count ?? 0) +
          (right.likes_count ?? 0) -
          ((left.rsvp_going_count ?? 0) + (left.likes_count ?? 0))
      )
      .slice(0, 3)
      .map(mapTrendingFeedPost);

    return ok({
      posts,
      total: posts.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load trending posts",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
