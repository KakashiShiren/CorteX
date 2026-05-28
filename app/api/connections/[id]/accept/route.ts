import { fail, ok, requireUserId } from "@/lib/http";
import { connectionSelect } from "@/lib/supabase/connections";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for connections.", 500);
    }

    const existing = await supabase
      .from("connections")
      .select(connectionSelect)
      .eq("id", params.id)
      .maybeSingle();

    if (existing.error) {
      return fail(existing.error.message, 500);
    }

    if (!existing.data) {
      return fail("Connection request not found.", 404);
    }

    if (existing.data.to_user_id !== userId) {
      return fail("Only the recipient can accept this request.", 403);
    }

    if (existing.data.status !== "pending") {
      return fail("This request has already been handled.", 400);
    }

    const update = await supabase
      .from("connections")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select(connectionSelect)
      .single();

    if (update.error || !update.data) {
      return fail(update.error?.message ?? "Unable to accept request", 500);
    }

    return ok({
      success: true,
      connection: update.data
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to accept request",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
