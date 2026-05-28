import { fail, ok, requireUserId } from "@/lib/http";
import { syncCanvasAssignments } from "@/lib/canvas";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for Canvas sync.", 500);
    }

    const result = await syncCanvasAssignments(supabase, userId);
    return ok(result);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to sync Canvas assignments",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
