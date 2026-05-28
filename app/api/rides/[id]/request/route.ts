import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/rides";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type RideScopeRow = {
  id: string;
  user_id: string;
  university_id: string | null;
  post_type: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
      .select("id, user_id, university_id, post_type")
      .eq("id", params.id)
      .eq("university_id", universityId)
      .eq("status", "active")
      .maybeSingle();

    if (rideQuery.error) {
      return fail(rideQuery.error.message, 500);
    }

    const ride = (rideQuery.data as RideScopeRow | null) ?? null;
    if (!ride) {
      return fail("Ride post not found.", 404);
    }

    if (ride.user_id === userId) {
      return fail("You cannot request your own ride post.");
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      seats_requested: number | string;
      message: string;
    }>;
    const seatsRequested = Number(body.seats_requested ?? 1);
    const message = body.message?.trim() ?? "";

    if (!Number.isFinite(seatsRequested) || seatsRequested < 1 || seatsRequested > 5) {
      return fail("Choose 1 to 5 seats.");
    }

    if (message.length > 500) {
      return fail("Messages can be at most 500 characters.");
    }

    const insertQuery = await supabase
      .from("ride_matches")
      .insert({
        ride_post_id: params.id,
        passenger_id: userId,
        seats_requested: Math.floor(seatsRequested),
        message,
        status: "pending"
      })
      .select("id")
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    return ok(
      {
        success: true,
        matchId: insertQuery.data.id
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create ride request",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
