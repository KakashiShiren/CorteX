import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/posts";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type PostLikeRow = {
  id: string;
  university_id: string | null;
  likes_count: number | null;
};

type ExistingReactionRow = {
  id: string;
  reaction: string | null;
};

async function getScopedReactionContext(postId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for posts.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const postQuery = await supabase
    .from("posts")
    .select("id, university_id, likes_count")
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    post: (postQuery.data as PostLikeRow | null) ?? null
  };
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedReactionContext(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const existingQuery = await supabase
      .from("post_reactions")
      .select("id, reaction")
      .eq("post_id", params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingQuery.error) {
      return fail(existingQuery.error.message, 500);
    }

    const existing = (existingQuery.data as ExistingReactionRow | null) ?? null;
    const alreadyLiked = existing?.reaction === "like";
    const upsertQuery = await supabase.from("post_reactions").upsert(
      {
        post_id: params.id,
        user_id: userId,
        reaction: "like"
      },
      {
        onConflict: "post_id,user_id"
      }
    );

    if (upsertQuery.error) {
      return fail(upsertQuery.error.message, 500);
    }

    const delta = alreadyLiked ? 0 : 1;
    const newCount = Math.max(0, (post.likes_count ?? 0) + delta);
    const updateQuery = await supabase
      .from("posts")
      .update({
        likes_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok({
      success: true,
      newCount
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to react to post",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedReactionContext(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const existingQuery = await supabase
      .from("post_reactions")
      .select("id, reaction")
      .eq("post_id", params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingQuery.error) {
      return fail(existingQuery.error.message, 500);
    }

    const existing = (existingQuery.data as ExistingReactionRow | null) ?? null;
    if (existing?.id) {
      const deleteQuery = await supabase.from("post_reactions").delete().eq("id", existing.id);

      if (deleteQuery.error) {
        return fail(deleteQuery.error.message, 500);
      }
    }

    const delta = existing?.reaction === "like" ? -1 : 0;
    const newCount = Math.max(0, (post.likes_count ?? 0) + delta);
    const updateQuery = await supabase
      .from("posts")
      .update({
        likes_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok({
      success: true,
      newCount
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to remove reaction",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
