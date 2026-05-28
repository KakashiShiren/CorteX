import Stripe from "stripe";

import { env } from "@/lib/env";
import { sendMarketplaceOrderEmail } from "@/lib/mailer";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function sendOrderEmails(orderId: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const orderQuery = await supabase
    .from("marketplace_orders")
    .select("id, price_paid, buyer_id, seller_id, item_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderQuery.error || !orderQuery.data) {
    return;
  }

  const order = orderQuery.data as {
    price_paid: number | string;
    buyer_id: string;
    seller_id: string;
    item_id: string;
  };

  const [itemQuery, usersQuery] = await Promise.all([
    supabase.from("marketplace_items").select("title").eq("id", order.item_id).maybeSingle(),
    supabase.from("users").select("id, email, name").in("id", [order.buyer_id, order.seller_id])
  ]);

  if (itemQuery.error || usersQuery.error || !itemQuery.data) {
    return;
  }

  const users = (usersQuery.data ?? []) as Array<{ id: string; email: string; name: string }>;
  const buyer = users.find((user) => user.id === order.buyer_id);
  const seller = users.find((user) => user.id === order.seller_id);

  if (!buyer || !seller) {
    return;
  }

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

async function completeOrder(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const orderId = paymentIntent.metadata.orderId;
  const itemId = paymentIntent.metadata.itemId;

  if (!orderId || !itemId) {
    return;
  }

  const now = new Date().toISOString();
  await supabase
    .from("marketplace_orders")
    .update({
      status: "completed",
      completed_at: now,
      stripe_payment_intent_id: paymentIntent.id
    })
    .eq("id", orderId);

  await supabase
    .from("marketplace_items")
    .update({
      is_available: false,
      status: "sold",
      updated_at: now
    })
    .eq("id", itemId);

  await sendOrderEmails(orderId);
}

async function refundOrder(charge: Stripe.Charge) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const orderQuery = await supabase
    .from("marketplace_orders")
    .select("id, item_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (orderQuery.error || !orderQuery.data) {
    return;
  }

  const order = orderQuery.data as { id: string; item_id: string };
  const now = new Date().toISOString();

  await supabase
    .from("marketplace_orders")
    .update({
      status: "refunded"
    })
    .eq("id", order.id);

  await supabase
    .from("marketplace_items")
    .update({
      is_available: true,
      status: "active",
      updated_at: now
    })
    .eq("id", order.item_id);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !env.stripeWebhookSecret) {
    return Response.json({ error: "Stripe webhook secret is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    await completeOrder(event.data.object as Stripe.PaymentIntent);
  }

  if (event.type === "charge.refunded") {
    await refundOrder(event.data.object as Stripe.Charge);
  }

  return Response.json({ received: true });
}
