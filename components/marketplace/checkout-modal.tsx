"use client";

import { useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { MarketplaceItem } from "@/lib/marketplace";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function CheckoutForm({
  item,
  userEmail,
  onSuccess,
  onClose
}: {
  item: MarketplaceItem;
  userEmail?: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState(userEmail ?? "");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const platformFee = Math.round(item.price * 0.1 * 100) / 100;
  const total = Math.round((item.price + platformFee) * 100) / 100;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!stripe || !elements) {
      setErrorMessage("Stripe is still loading.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Add your email for the receipt.");
      return;
    }

    if (!agreed) {
      setErrorMessage("Agree to the marketplace terms before purchasing.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("Card details are not ready.");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkout = await apiFetch<{
        clientSecret: string;
        orderId: string;
        breakdown: { itemPrice: number; platformFee: number; total: number };
      }>("/api/marketplace/checkout", {
        method: "POST",
        body: JSON.stringify({
          itemId: item.id,
          amount: total,
          deliveryMethod: item.shippingAvailable && !item.localPickup ? "shipping" : "local_pickup",
          email: email.trim()
        })
      });

      const result = await stripe.confirmCardPayment(checkout.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email.trim()
          }
        }
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Payment failed. Try another card.");
        return;
      }

      if (result.paymentIntent?.id) {
        await apiFetch("/api/marketplace/checkout/complete", {
          method: "POST",
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id
          })
        });
      }

      onSuccess("Purchase complete! The seller has been notified.");
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to complete checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex gap-4">
        <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[18px] bg-black/6 dark:bg-white/8">
          {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={item.title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-cortex-ink dark:text-white">{item.title}</div>
          <div className="mt-2 text-xs text-black/54 dark:text-white/56">Sold by {item.seller.name}</div>
        </div>
      </div>

      <div className="rounded-[20px] border border-black/8 bg-white/38 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex justify-between gap-4">
          <span>Item price</span>
          <span>{formatCurrency(item.price)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-4 text-black/58 dark:text-white/60">
          <span>Platform fee (10%)</span>
          <span>{formatCurrency(platformFee)}</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 border-t border-black/8 pt-3 font-semibold dark:border-white/10">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Card</label>
        <div className="rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 py-4 dark:border-white/10 dark:bg-white/[0.05]">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs leading-5 text-black/58 dark:text-white/60">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 accent-[#3f5f55]" />
        I agree to the marketplace terms and understand pickup or shipping is coordinated with the seller.
      </label>

      {errorMessage ? <p className="text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting || !stripe}>
        {isSubmitting ? "Processing..." : "Complete Purchase"}
      </Button>
    </form>
  );
}

export function CheckoutModal({
  item,
  userEmail,
  onClose,
  onSuccess
}: {
  item: MarketplaceItem | null;
  userEmail?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const options = useMemo(() => ({}), []);

  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/42 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div className="cortex-panel w-full max-w-xl p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Checkout</div>
              <div className="mt-3 font-display text-3xl">Buy Now</div>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise as Promise<Stripe | null>} options={options}>
              <CheckoutForm item={item} userEmail={userEmail} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <div className="rounded-[20px] border border-cortex-ember/18 bg-cortex-ember/8 p-4 text-sm text-cortex-garnet dark:text-cortex-gold">
              Stripe is not configured. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` to use checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
