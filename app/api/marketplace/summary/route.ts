import { fail, ok, requireUserId } from "@/lib/http";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace summary.", 500);
    }

    const [pendingOrdersQuery, listingsQuery, salesQuery, ownedItemsQuery] = await Promise.all([
      supabase
        .from("marketplace_orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", userId)
        .eq("status", "pending"),
      supabase
        .from("marketplace_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("marketplace_orders")
        .select("price_paid, seller_earnings")
        .eq("seller_id", userId)
        .eq("status", "completed"),
      supabase
        .from("marketplace_items")
        .select("id")
        .eq("user_id", userId)
    ]);

    for (const query of [pendingOrdersQuery, listingsQuery, salesQuery, ownedItemsQuery]) {
      if (query.error) {
        return fail(query.error.message, 500);
      }
    }

    const sales = (salesQuery.data ?? []) as Array<{ price_paid: number | string; seller_earnings: number | string }>;
    const itemIds = ((ownedItemsQuery.data ?? []) as Array<{ id: string }>).map((item) => item.id);
    const followersQuery = itemIds.length
      ? await supabase.from("marketplace_saves").select("user_id").in("item_id", itemIds)
      : { data: [], error: null };

    if (followersQuery.error) {
      return fail(followersQuery.error.message, 500);
    }

    const followerCount = new Set(((followersQuery.data ?? []) as Array<{ user_id: string }>).map((save) => save.user_id)).size;
    const revenue = sales.reduce((total, order) => total + Number(order.price_paid), 0);
    const earnings = sales.reduce((total, order) => total + Number(order.seller_earnings), 0);

    return ok({
      badgeCount: pendingOrdersQuery.count ?? 0,
      pendingOffers: pendingOrdersQuery.count ?? 0,
      activeListings: listingsQuery.count ?? 0,
      followers: followerCount,
      salesCount: sales.length,
      revenue,
      earnings
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to load marketplace summary",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
