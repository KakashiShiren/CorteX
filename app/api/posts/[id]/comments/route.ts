import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId, hydrateFeedComments } from "@/lib/posts";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type PostScopeRow = {
  id: string;
  university_id: string | null;
  comments_count: number | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

async function getScopedPost(postId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for post comments.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const postQuery = await supabase
    .from("posts")
    .select("id, university_id, comments_count")
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    post: (postQuery.data as PostScopeRow | null) ?? null
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedPost(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const commentsQuery = await supabase
      .from("post_comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", params.id)
      .order("created_at", { ascending: true });

    if (commentsQuery.error) {
      return fail(commentsQuery.error.message, 500);
    }

    const comments = await hydrateFeedComments(supabase, (commentsQuery.data ?? []) as CommentRow[]);
    return ok({
      comments,
      total: comments.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load comments",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, post } = await getScopedPost(params.id, userId);

    if (!post) {
      return fail("Post not found.", 404);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{ content: string }>;
    const content = body.content?.trim() ?? "";

    if (!content) {
      return fail("Write a comment before posting.");
    }

    if (content.length > 300) {
      return fail("Comments can be at most 300 characters.");
    }

    const insertQuery = await supabase
      .from("post_comments")
      .insert({
        post_id: params.id,
        user_id: userId,
        content
      })
      .select("id, post_id, user_id, content, created_at")
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const countQuery = await supabase
      .from("post_comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", params.id);

    if (countQuery.error) {
      return fail(countQuery.error.message, 500);
    }

    const newCount = countQuery.count ?? Math.max(0, (post.comments_count ?? 0) + 1);
    const updateQuery = await supabase
      .from("posts")
      .update({
        comments_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    const [comment] = await hydrateFeedComments(supabase, [insertQuery.data as CommentRow]);
    return ok(
      {
        comment,
        newCount
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create comment",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
