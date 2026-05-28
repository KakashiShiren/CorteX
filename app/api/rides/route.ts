import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  getRideExpiry,
  hydrateRidePosts,
  isRidePostType,
  ridePostSelect,
  type RidePostRow
} from "@/lib/rides";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function parseNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesTimeFilter(row: RidePostRow, timeFilter: string | null) {
  if (!timeFilter || !row.departure_time) {
    return true;
  }

  const hour = new Date(row.departure_time).getHours();

  if (timeFilter === "morning") {
    return hour >= 6 && hour < 12;
  }

  if (timeFilter === "afternoon") {
    return hour >= 12 && hour < 18;
  }

  if (timeFilter === "evening") {
    return hour >= 18 && hour < 24;
  }

  if (timeFilter === "night") {
    return hour >= 0 && hour < 6;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for rides.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 500);
    const limit = parsePositiveInt(searchParams.get("limit"), 15, 50);
    const typeParam = searchParams.get("type");
    const destination = searchParams.get("destination")?.trim();
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const priceMin = parseNumber(searchParams.get("price_min"));
    const priceMax = parseNumber(searchParams.get("price_max"));
    const seats = parseNumber(searchParams.get("seats"));
    const timeFilter = searchParams.get("time_filter");

    if (typeParam && !isRidePostType(typeParam)) {
      return fail("Choose a valid ride type.");
    }

    let query = supabase
      .from("ride_posts")
      .select(ridePostSelect)
      .eq("university_id", universityId)
      .eq("status", "active")
      .or("expires_at.is.null,expires_at.gt.now()");

    if (typeParam) {
      query = query.eq("post_type", typeParam);
    }

    if (destination) {
      query = query.ilike("destination", `%${destination}%`);
    }

    if (dateFrom) {
      query = query.gte("departure_time", new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("departure_time", end.toISOString());
    }

    if (priceMin !== null) {
      query = query.gte("cost_per_seat", priceMin);
    }

    if (priceMax !== null) {
      query = query.lte("cost_per_seat", priceMax);
    }

    if (seats !== null) {
      query = query.gte("seats_available", seats);
    }

    const result = await query.order("created_at", { ascending: false }).limit(500);

    if (result.error) {
      return fail(result.error.message, 500);
    }

    const filteredRows = ((result.data ?? []) as RidePostRow[]).filter((row) => matchesTimeFilter(row, timeFilter));
    const from = (page - 1) * limit;
    const pageRows = filteredRows.slice(from, from + limit);
    const rides = await hydrateRidePosts(supabase, pageRows);

    return ok({
      rides,
      hasMore: filteredRows.length > from + rides.length,
      total: filteredRows.length
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load rides",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for rides.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      post_type: string;
      departure_location: string | null;
      destination: string | null;
      departure_time: string | null;
      seats_available: number | string | null;
      cost_per_seat: number | string | null;
      flexible_timing: boolean;
      description: string | null;
      image_url: string | null;
      is_recurring: boolean;
      recurring_days: string | null;
    }>;
    const postType = isRidePostType(body.post_type) ? body.post_type : null;
    const departureLocation = body.departure_location?.trim() || null;
    const destination = body.destination?.trim() || null;
    const departureTime = body.departure_time ? new Date(body.departure_time) : null;
    const seatsAvailable = body.seats_available === undefined || body.seats_available === null ? null : Number(body.seats_available);
    const costPerSeat = body.cost_per_seat === undefined || body.cost_per_seat === null ? null : Number(body.cost_per_seat);
    const description = body.description?.trim() || null;
    const imageUrl = body.image_url?.trim() || null;

    if (!postType) {
      return fail("Choose whether you are driving or need a ride.");
    }

    if (!destination) {
      return fail("Add a destination.");
    }

    if (postType === "driver" && !departureLocation) {
      return fail("Add a departure location.");
    }

    if (departureTime && Number.isNaN(departureTime.getTime())) {
      return fail("Choose a valid departure time.");
    }

    if (seatsAvailable !== null && (!Number.isFinite(seatsAvailable) || seatsAvailable < 1 || seatsAvailable > 7)) {
      return fail("Choose a valid seat count.");
    }

    if (costPerSeat !== null && (!Number.isFinite(costPerSeat) || costPerSeat < 0 || costPerSeat > 500)) {
      return fail("Choose a valid cost.");
    }

    if (description && description.length > 200) {
      return fail("Ride notes can be at most 200 characters.");
    }

    const insertQuery = await supabase
      .from("ride_posts")
      .insert({
        user_id: userId,
        university_id: universityId,
        post_type: postType,
        departure_location: departureLocation,
        destination,
        departure_time: departureTime?.toISOString() ?? null,
        seats_available: seatsAvailable,
        cost_per_seat: costPerSeat,
        flexible_timing: Boolean(body.flexible_timing),
        description,
        image_url: imageUrl,
        is_recurring: Boolean(body.is_recurring),
        recurring_days: body.recurring_days?.trim() || null,
        expires_at: getRideExpiry(postType, departureTime)
      })
      .select(ridePostSelect)
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [ride] = await hydrateRidePosts(supabase, [insertQuery.data as RidePostRow]);
    return ok(ride, { status: 201 });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create ride",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
