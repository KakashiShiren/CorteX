import { fail, ok, requireUserId } from "@/lib/http";
import { sendMarketplaceOrderEmail } from "@/lib/mailer";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return fail("Supabase is not configured for marketplace checkout.", 500);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{ paymentIntentId: string }>;
    const paymentIntentId = body.paymentIntentId?.trim();

    if (!paymentIntentId) {
      return fail("Missing payment confirmation.");
    }

    const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return fail("Payment has not completed yet.", 409);
    }

    const orderId = paymentIntent.metadata.orderId;
    const itemId = paymentIntent.metadata.itemId;

    if (!orderId || !itemId) {
      return fail("Payment is missing Grove marketplace metadata.", 400);
    }

    const orderQuery = await supabase
      .from("marketplace_orders")
      .select("id, buyer_id, seller_id, item_id, price_paid, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderQuery.error) {
      return fail(orderQuery.error.message, 500);
    }

    const order = orderQuery.data as {
      id: string;
      buyer_id: string;
      seller_id: string;
      item_id: string;
      price_paid: number | string;
      status: string | null;
    } | null;

    if (!order || order.buyer_id !== userId) {
      return fail("You can complete your own purchases only.", 403);
    }

    const now = new Date().toISOString();
    const updateOrder = await supabase
      .from("marketplace_orders")
      .update({
        status: "completed",
        completed_at: now,
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq("id", order.id);

    if (updateOrder.error) {
      return fail(updateOrder.error.message, 500);
    }

    const updateItem = await supabase
      .from("marketplace_items")
      .update({
        is_available: false,
        status: "sold",
        updated_at: now
      })
      .eq("id", itemId);

    if (updateItem.error) {
      return fail(updateItem.error.message, 500);
    }

    const [itemQuery, usersQuery] = await Promise.all([
      supabase.from("marketplace_items").select("title").eq("id", itemId).maybeSingle(),
      supabase.from("users").select("id, email, name").in("id", [order.buyer_id, order.seller_id])
    ]);

    if (!itemQuery.error && !usersQuery.error && itemQuery.data) {
      const users = (usersQuery.data ?? []) as Array<{ id: string; email: string; name: string }>;
      const buyer = users.find((user) => user.id === order.buyer_id);
      const seller = users.find((user) => user.id === order.seller_id);

      if (buyer && seller) {
        await Promise.allSettled([
          sendMarketplaceOrderEmail({
            to: buyer.email,
            role: "buyer",
            itemTitle: itemQuery.data.title,
            amount: Number(order.price_paid),
            buyerName: buyer.name,
            sellerName: seller.name
          }),
          sendMarketplaceOrderEmail({
            to: seller.email,
            role: "seller",
            itemTitle: itemQuery.data.title,
            amount: Number(order.price_paid),
            buyerName: buyer.name,
            sellerName: seller.name
          })
        ]);
      }
    }

    return ok({ success: true, orderId: order.id });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED"
          ? "Stripe is not configured for marketplace checkout."
          : error instanceof Error
            ? error.message
            : "Unable to complete marketplace checkout",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
