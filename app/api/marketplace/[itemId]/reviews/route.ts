import { fail, ok, requireUserId } from "@/lib/http";
import {
  getCurrentUserUniversityId,
  hydrateMarketplaceReviews
} from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace reviews.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const itemQuery = await supabase
      .from("marketplace_items")
      .select("id")
      .eq("id", params.itemId)
      .eq("university_id", universityId)
      .maybeSingle();

    if (itemQuery.error) {
      return fail(itemQuery.error.message, 500);
    }

    if (!itemQuery.data) {
      return fail("Marketplace item not found.", 404);
    }

    const ordersQuery = await supabase
      .from("marketplace_orders")
      .select("id")
      .eq("item_id", params.itemId);

    if (ordersQuery.error) {
      return fail(ordersQuery.error.message, 500);
    }

    const orderIds = ((ordersQuery.data ?? []) as Array<{ id: string }>).map((row) => row.id);

    if (!orderIds.length) {
      return ok({ reviews: [], total: 0 });
    }

    const reviewsQuery = await supabase
      .from("marketplace_reviews")
      .select("id, order_id, reviewer_id, reviewee_id, rating, comment, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (reviewsQuery.error) {
      return fail(reviewsQuery.error.message, 500);
    }

    const reviews = await hydrateMarketplaceReviews(supabase, (reviewsQuery.data ?? []) as any[]);
    return ok({ reviews, total: reviews.length });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load marketplace reviews",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
