import { fail, ok, requireUserId } from "@/lib/http";
import { hydrateMarketplaceReviews } from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace reviews.", 500);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      orderId: string;
      rating: number;
      comment: string;
    }>;
    const orderId = body.orderId?.trim();
    const rating = Number(body.rating);
    const comment = body.comment?.trim() || null;

    if (!orderId) {
      return fail("Choose an order to review.");
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return fail("Choose a rating from 1 to 5.");
    }

    if (comment && comment.length > 500) {
      return fail("Reviews can be at most 500 characters.");
    }

    const orderQuery = await supabase
      .from("marketplace_orders")
      .select("id, buyer_id, seller_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderQuery.error) {
      return fail(orderQuery.error.message, 500);
    }

    const order = orderQuery.data as { id: string; buyer_id: string; seller_id: string; status: string | null } | null;

    if (!order || order.buyer_id !== userId || order.status !== "completed") {
      return fail("You can review completed purchases only.", 403);
    }

    const existingReview = await supabase
      .from("marketplace_reviews")
      .select("id")
      .eq("order_id", orderId)
      .eq("reviewer_id", userId)
      .maybeSingle();

    if (existingReview.error && existingReview.error.code !== "PGRST116") {
      return fail(existingReview.error.message, 500);
    }

    if (existingReview.data) {
      return fail("You already reviewed this purchase.");
    }

    const insertQuery = await supabase
      .from("marketplace_reviews")
      .insert({
        order_id: orderId,
        reviewer_id: userId,
        reviewee_id: order.seller_id,
        rating,
        comment
      })
      .select("id, order_id, reviewer_id, reviewee_id, rating, comment, created_at")
      .single();

    if (insertQuery.error) {
      return fail(insertQuery.error.message, 500);
    }

    const [review] = await hydrateMarketplaceReviews(supabase, [insertQuery.data as any]);
    return ok(review, { status: 201 });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to create marketplace review",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
