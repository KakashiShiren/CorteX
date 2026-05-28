import Stripe from "stripe";

import { env } from "@/lib/env";

export const MARKETPLACE_PLATFORM_FEE_RATE = 0.1;

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      typescript: true
    });
  }

  return stripeClient;
}

export function calculateMarketplaceFees(price: number) {
  const normalizedPrice = Math.max(0, Number(price) || 0);
  const platformFee = Math.round(normalizedPrice * MARKETPLACE_PLATFORM_FEE_RATE * 100) / 100;
  const total = Math.round((normalizedPrice + platformFee) * 100) / 100;

  return {
    itemPrice: normalizedPrice,
    platformFee,
    sellerEarnings: normalizedPrice,
    total,
    totalCents: Math.round(total * 100)
  };
}
