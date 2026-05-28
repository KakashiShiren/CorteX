import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateFeedPosts,
  postSelect,
  type PostRow
} from "@/lib/posts";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

async function getScopedPost(postId: string, userId: string) {
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
    .select(postSelect)
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    post: (postQuery.data as PostRow | null) ?? null
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedPost(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const [hydratedPost] = await hydrateFeedPosts(supabase, userId, [post]);
    return ok(hydratedPost);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load post",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedPost(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    if (post.user_id !== userId) {
      return fail("You can only delete your own posts.", 403);
    }

    const deleteQuery = await supabase.from("posts").delete().eq("id", params.id);

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
          : "Unable to delete post",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
