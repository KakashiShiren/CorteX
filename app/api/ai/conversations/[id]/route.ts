import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for AI conversations.", 500);
    }

    const query = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", params.id)
      .eq("user_id", userId);

    if (query.error) {
      return fail(query.error.message, 500);
    }

    return ok({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : "Unable to delete conversation",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
