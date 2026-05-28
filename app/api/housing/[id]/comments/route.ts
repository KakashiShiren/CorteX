import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId, hydrateHousingComments, type HousingCommentRow } from "@/lib/housing";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

async function ensureScopedHousingPost(postId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for housing comments.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const postQuery = await supabase
    .from("housing_posts")
    .select("id")
    .eq("id", postId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (postQuery.error) {
    throw new Error(postQuery.error.message);
  }

  return {
    supabase,
    exists: Boolean(postQuery.data)
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, exists } = await ensureScopedHousingPost(params.id, userId);

    if (!exists) {
      return fail("Housing listing not found.", 404);
    }

    const commentsQuery = await supabase
      .from("housing_comments")
      .select("id, housing_post_id, user_id, content, created_at")
      .eq("housing_post_id", params.id)
      .order("created_at", { ascending: true });

    if (commentsQuery.error) {
      return fail(commentsQuery.error.message, 500);
    }

    const comments = await hydrateHousingComments(supabase, (commentsQuery.data ?? []) as HousingCommentRow[]);
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
          : "Unable to load housing comments",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, exists } = await ensureScopedHousingPost(params.id, userId);

    if (!exists) {
      return fail("Housing listing not found.", 404);
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
      .from("housing_comments")
      .insert({
        housing_post_id: params.id,
        user_id: userId,
        content
      })
      .select("id, housing_post_id, user_id, content, created_at")
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [comment] = await hydrateHousingComments(supabase, [insertQuery.data as HousingCommentRow]);
    return ok(
      {
        comment
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create housing comment",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
