import { fail, ok, requireUserId } from "@/lib/http";
import { getCurrentUserUniversityId } from "@/lib/marketplace";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { calculateMarketplaceFees, getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace checkout.", 500);
    }

    const universityId = await getCurrentUserUniversityId(supabase, userId);
    if (!universityId) {
      return fail("Your campus workspace is still being prepared.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      itemId: string;
      amount: number;
      deliveryMethod: string;
      email: string;
    }>;
    const itemId = body.itemId?.trim();

    if (!itemId) {
      return fail("Choose an item to purchase.");
    }

    const itemQuery = await supabase
      .from("marketplace_items")
      .select("id, user_id, title, price, is_available, status, university_id")
      .eq("id", itemId)
      .eq("university_id", universityId)
      .maybeSingle();

    if (itemQuery.error) {
      return fail(itemQuery.error.message, 500);
    }

    const item = itemQuery.data as {
      id: string;
      user_id: string;
      title: string;
      price: number | string;
      is_available: boolean | null;
      status: string | null;
    } | null;

    if (!item || !item.is_available || item.status !== "active") {
      return fail("This item is no longer available.", 409);
    }

    if (item.user_id === userId) {
      return fail("You cannot buy your own item.");
    }

    const fees = calculateMarketplaceFees(Number(item.price));
    const pendingOrder = await supabase
      .from("marketplace_orders")
      .insert({
        item_id: item.id,
        buyer_id: userId,
        seller_id: item.user_id,
        price_paid: fees.total,
        platform_fee: fees.platformFee,
        seller_earnings: fees.sellerEarnings,
        status: "pending",
        delivery_method: body.deliveryMethod === "shipping" ? "shipping" : "local_pickup"
      })
      .select("id")
      .single();

    if (pendingOrder.error || !pendingOrder.data) {
      return fail(pendingOrder.error?.message ?? "Unable to create order.", 500);
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: fees.totalCents,
      currency: "usd",
      payment_method_types: ["card"],
      receipt_email: body.email?.trim() || undefined,
      description: `Grove marketplace purchase: ${item.title}`,
      metadata: {
        orderId: pendingOrder.data.id,
        itemId: item.id,
        buyerId: userId,
        sellerId: item.user_id,
        itemPrice: fees.itemPrice.toFixed(2),
        platformFee: fees.platformFee.toFixed(2),
        sellerEarnings: fees.sellerEarnings.toFixed(2)
      }
    });

    const updateOrder = await supabase
      .from("marketplace_orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq("id", pendingOrder.data.id);

    if (updateOrder.error) {
      return fail(updateOrder.error.message, 500);
    }

    return ok({
      clientSecret: paymentIntent.client_secret,
      orderId: pendingOrder.data.id,
      breakdown: {
        itemPrice: fees.itemPrice,
        platformFee: fees.platformFee,
        total: fees.total,
        sellerEarnings: fees.sellerEarnings
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout.";

    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : message === "STRIPE_NOT_CONFIGURED"
          ? "Stripe is not configured for marketplace checkout."
          : message,
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
