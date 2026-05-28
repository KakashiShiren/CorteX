import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/rides";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const allowedStatuses = new Set(["approved", "rejected", "completed"]);

export async function PATCH(request: Request, { params }: { params: { id: string; matchId: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for ride requests.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const rideQuery = await supabase
      .from("ride_posts")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", userId)
      .eq("university_id", universityId)
      .maybeSingle();

    if (rideQuery.error) {
      return fail(rideQuery.error.message, 500);
    }

    if (!rideQuery.data) {
      return fail("Only the ride poster can update requests.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{ status: string }>;
    const status = body.status?.trim() ?? "";

    if (!allowedStatuses.has(status)) {
      return fail("Choose a valid request status.");
    }

    const updateQuery = await supabase
      .from("ride_matches")
      .update({ status })
      .eq("id", params.matchId)
      .eq("ride_post_id", params.id)
      .select("id, status")
      .single();

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    return ok({
      success: true,
      matchId: updateQuery.data.id,
      status: updateQuery.data.status
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update ride request",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
