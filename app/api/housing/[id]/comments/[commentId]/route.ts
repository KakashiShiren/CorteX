import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/housing";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: { id: string; commentId: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for housing comments.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const postQuery = await supabase
      .from("housing_posts")
      .select("id")
      .eq("id", params.id)
      .eq("university_id", universityId)
      .maybeSingle();

    if (postQuery.error) {
      return fail(postQuery.error.message, 500);
    }

    if (!postQuery.data) {
      return fail("Housing listing not found.", 404);
    }

    const deleteQuery = await supabase
      .from("housing_comments")
      .delete()
      .eq("id", params.commentId)
      .eq("housing_post_id", params.id)
      .eq("user_id", userId);

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
          : "Unable to delete housing comment",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
