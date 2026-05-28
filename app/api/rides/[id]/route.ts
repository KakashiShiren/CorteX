import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateRidePosts,
  isRidePostType,
  ridePostSelect,
  type RidePostRow
} from "@/lib/rides";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

async function getScopedRide(rideId: string, userId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for rides.");
  }

  const universityId = await getCurrentUserUniversityId(supabase, userId);
  if (!universityId) {
    throw new Error("Your campus workspace is still being prepared.");
  }

  const rideQuery = await supabase
    .from("ride_posts")
    .select(ridePostSelect)
    .eq("id", rideId)
    .eq("university_id", universityId)
    .maybeSingle();

  if (rideQuery.error) {
    throw new Error(rideQuery.error.message);
  }

  return {
    supabase,
    ride: (rideQuery.data as RidePostRow | null) ?? null
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, ride } = await getScopedRide(params.id, userId);

    if (!ride) {
      return fail("Ride post not found.", 404);
    }

    const [hydratedRide] = await hydrateRidePosts(supabase, [ride]);
    return ok(hydratedRide);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load ride",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, ride } = await getScopedRide(params.id, userId);

    if (!ride) {
      return fail("Ride post not found.", 404);
    }

    if (ride.user_id !== userId) {
      return fail("You can only update your own ride posts.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    for (const key of [
      "departure_location",
      "destination",
      "departure_time",
      "seats_available",
      "cost_per_seat",
      "flexible_timing",
      "description",
      "image_url",
      "is_recurring",
      "recurring_days",
      "status",
      "expires_at"
    ]) {
      if (key in body) {
        payload[key] = body[key];
      }
    }

    if ("post_type" in body) {
      const nextType = typeof body.post_type === "string" && isRidePostType(body.post_type) ? body.post_type : null;
      if (!nextType) {
        return fail("Choose a valid ride type.");
      }
      payload.post_type = nextType;
    }

    const updateQuery = await supabase
      .from("ride_posts")
      .update(payload)
      .eq("id", params.id)
      .select(ridePostSelect)
      .single();

    if (updateQuery.error) {
      return fail(updateQuery.error.message, 500);
    }

    const [updatedRide] = await hydrateRidePosts(supabase, [updateQuery.data as RidePostRow]);
    return ok(updatedRide);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to update ride",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = requireUserId();
    const { supabase, ride } = await getScopedRide(params.id, userId);

    if (!ride) {
      return fail("Ride post not found.", 404);
    }

    if (ride.user_id !== userId) {
      return fail("You can only delete your own ride posts.", 403);
    }

    const deleteQuery = await supabase.from("ride_posts").delete().eq("id", params.id);

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
          : "Unable to delete ride",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
