import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateHousingComments,
  hydrateHousingPosts,
  housingPostSelect,
  type HousingCommentRow,
  type HousingPostRow
} from "@/lib/housing";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

async function getScopedHousingPost(postId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for housing.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const postQuery = await supabase
    .from("housing_posts")
    .select(housingPostSelect)
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    post: (postQuery.data as HousingPostRow | null) ?? null
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedHousingPost(params.id, userId);

    if (!post) {
      return fail("Housing listing not found.", 404);
    }

    const commentsQuery = await supabase
      .from("housing_comments")
      .select("id, housing_post_id, user_id, content, created_at")
      .eq("housing_post_id", params.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (commentsQuery.error) {
      return fail(commentsQuery.error.message, 500);
    }

    const [listing] = await hydrateHousingPosts(supabase, [post]);
    const comments = await hydrateHousingComments(supabase, (commentsQuery.data ?? []) as HousingCommentRow[]);

    return ok({
      listing,
      comments,
      totalComments: comments.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load housing listing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedHousingPost(params.id, userId);

    if (!post) {
      return fail("Housing listing not found.", 404);
    }

    if (post.user_id !== userId) {
      return fail("You can only update your own housing listings.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    for (const key of [
      "title",
      "description",
      "location",
      "latitude",
      "longitude",
      "price_per_month",
      "bedrooms",
      "bathrooms",
      "square_feet",
      "amenities",
      "available_from",
      "lease_length",
      "contact_email",
      "contact_phone",
      "images_url",
      "status"
    ]) {
      if (key in body) {
        payload[key] = body[key];
      }
    }

    const updateQuery = await supabase
      .from("housing_posts")
      .update(payload)
      .eq("id", params.id)
      .select(housingPostSelect)
      .single();

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    const [listing] = await hydrateHousingPosts(supabase, [updateQuery.data as HousingPostRow]);
    return ok(listing);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update housing listing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedHousingPost(params.id, userId);

    if (!post) {
      return fail("Housing listing not found.", 404);
    }

    if (post.user_id !== userId) {
      return fail("You can only delete your own housing listings.", 403);
    }

    const deleteQuery = await supabase.from("housing_posts").delete().eq("id", params.id);

    if (deleteQuery.error) {
      return fail(deleteQuery.error.message, 500);
    }

    return ok({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to delete housing listing",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
