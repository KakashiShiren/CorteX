"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, ShieldCheck, ShoppingBag, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { MarketplaceItem, MarketplaceItemDetail, MarketplaceReview } from "@/lib/marketplace";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function timeAgo(date: string) {
  const delta = Date.now() - new Date(date).getTime();
  const days = Math.max(0, Math.floor(delta / (24 * 60 * 60 * 1000)));

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-cortex-gold">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-3.5 w-3.5 ${index < Math.round(value) ? "fill-current" : ""}`} />
      ))}
    </span>
  );
}

function ReviewRow({ review }: { review: MarketplaceReview }) {
  return (
    <div className="rounded-[18px] border border-black/8 bg-white/36 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex gap-3">
        <Avatar name={review.reviewer.name} imageUrl={review.reviewer.profilePictureUrl} avatarColor={review.reviewer.avatarColor} size="sm" className="h-7 w-7 text-[10px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-black/52 dark:text-white/56">
            <span className="font-semibold text-cortex-ink dark:text-white">{review.reviewer.name}</span>
            <span>·</span>
            <span>{timeAgo(review.createdAt)}</span>
          </div>
          <div className="mt-1 text-[11px]">
            <Stars value={review.rating} />
          </div>
          {review.comment ? <p className="mt-2 text-xs leading-6 text-black/62 dark:text-white/64">{review.comment}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  orderId,
  onClose,
  onPosted
}: {
  orderId: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await apiFetch<MarketplaceReview>("/api/marketplace/reviews", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          rating,
          comment
        })
      });
      onPosted();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to post review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/44 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-center justify-center">
        <div className="cortex-panel w-full max-w-md p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Review</div>
              <div className="mt-3 font-display text-3xl">Leave a review</div>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button key={value} type="button" onClick={() => setRating(value)} className="text-cortex-gold">
                    <Star className={`h-7 w-7 ${value <= rating ? "fill-current" : ""}`} />
                  </button>
                );
              })}
            </div>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 500))} placeholder="Share your experience" />
          </div>

          {errorMessage ? <p className="mt-4 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

          <div className="mt-6">
            <Button className="w-full" disabled={isSubmitting} onClick={() => void submit()}>
              {isSubmitting ? "Posting..." : "Post Review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceDetailModal({
  itemId,
  fallbackItem,
  currentUserId,
  onClose,
  onBuy,
  onMessage,
  onToggleSave,
  onToast
}: {
  itemId: string | null;
  fallbackItem?: MarketplaceItem | null;
  currentUserId?: string;
  onClose: () => void;
  onBuy: (item: MarketplaceItem) => void;
  onMessage: (item: MarketplaceItem) => void;
  onToggleSave: (item: MarketplaceItem) => void;
  onToast: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [imageIndex, setImageIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);

  const itemQuery = useQuery({
    queryKey: ["marketplace-item", itemId],
    enabled: Boolean(itemId),
    queryFn: () => apiFetch<MarketplaceItemDetail>(`/api/marketplace/${itemId}`)
  });

  const detail = itemQuery.data;
  const item = detail ?? fallbackItem;
  const images = useMemo(() => item?.imageUrls ?? [], [item?.imageUrls]);

  useEffect(() => {
    setImageIndex(0);
  }, [itemId]);

  useEffect(() => {
    if (!itemId) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [itemId]);

  if (!itemId || !item) {
    return null;
  }

  const activeImage = images[imageIndex] ?? images[0];
  const isOwnItem = currentUserId === item.userId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/44 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div className="cortex-panel w-full max-w-6xl overflow-hidden p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4 px-1">
            <div>
              <div className="eyebrow">Item Detail</div>
              <h2 className="mt-2 font-display text-[2rem] leading-tight sm:text-[2.6rem]">{item.title}</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          {itemQuery.isLoading && !detail ? (
            <div className="p-8 text-sm text-black/56 dark:text-white/58">Loading item details...</div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[24px] border border-black/8 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04]">
                {activeImage ? (
                  <img src={activeImage} alt={item.title} className="max-h-[500px] min-h-[320px] w-full object-contain" />
                ) : (
                  <div className="grid h-[380px] place-items-center text-sm text-black/46 dark:text-white/48">No image</div>
                )}
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setImageIndex((current) => (current === 0 ? images.length - 1 : current - 1))}
                      className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-cortex-ink shadow-[0_10px_20px_rgba(18,17,15,0.1)]"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageIndex((current) => (current + 1) % images.length)}
                      className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-cortex-ink shadow-[0_10px_20px_rgba(18,17,15,0.1)]"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>

              {images.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setImageIndex(index)}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-[14px] border transition ${
                        index === imageIndex ? "border-cortex-ink dark:border-white" : "border-black/8 dark:border-white/10"
                      }`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold text-cortex-garnet dark:text-cortex-gold">{formatCurrency(item.price)}</div>
                  {item.allowsNegotiation ? <div className="mt-1 text-xs text-black/52 dark:text-white/56">Asking for negotiation</div> : null}
                </div>
                <div className="text-right text-xs text-black/54 dark:text-white/56">
                  <Stars value={item.seller.rating} /> <span className="ml-1">{item.seller.rating.toFixed(1)} with {item.seller.reviewsCount} reviews</span>
                </div>
              </div>

              <div className="rounded-[22px] border border-black/8 bg-white/38 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex gap-3">
                  <Avatar name={item.seller.name} imageUrl={item.seller.profilePictureUrl} avatarColor={item.seller.avatarColor} className="h-10 w-10" />
                  <div>
                    <div className="text-sm font-semibold">{item.seller.name}</div>
                    <button type="button" className="mt-1 text-xs text-black/58 underline-offset-4 hover:underline dark:text-white/60">
                      ★ {item.seller.rating.toFixed(1)} ({item.seller.reviewsCount} reviews)
                    </button>
                    <div className="mt-2 text-[11px] text-black/48 dark:text-white/50">{item.seller.responseTime}</div>
                    <div className="text-[11px] text-black/48 dark:text-white/50">
                      Member for {item.seller.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(item.seller.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))) : 1} months
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Category", item.category],
                  ["Condition", item.condition ?? "Not listed"],
                  ["Posted", timeAgo(item.createdAt)],
                  ["Views", String(item.viewsCount)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-black/8 bg-white/34 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="micro-label">{label}</div>
                    <div className="mt-1 font-semibold text-cortex-ink dark:text-white">{value}</div>
                  </div>
                ))}
              </div>

              {item.description ? <p className="text-[13px] leading-7 text-black/64 dark:text-white/66">{item.description}</p> : null}

              {Object.keys(item.specifications).length ? (
                <div className="rounded-[20px] border border-black/8 bg-white/34 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                  <div className="micro-label">Specifications</div>
                  <div className="mt-3 space-y-2">
                    {Object.entries(item.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 text-xs">
                        <span className="text-black/50 dark:text-white/52">{key}</span>
                        <span className="text-right font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[20px] border border-black/8 bg-white/34 p-4 text-xs dark:border-white/10 dark:bg-white/[0.035]">
                <div className="micro-label">Shipping/Pickup</div>
                <div className="mt-3 space-y-2 text-black/62 dark:text-white/64">
                  <div>{item.localPickup ? "☑" : "☐"} Local pickup only</div>
                  <div>{item.shippingAvailable ? "☑" : "☐"} Shipping available</div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" disabled={isOwnItem || !item.isAvailable} onClick={() => onBuy(item)}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Buy Now
                </Button>
                <Button variant="outline" className="w-full" disabled={isOwnItem} onClick={() => onMessage(item)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message Seller
                </Button>
                <Button variant="outline" className="w-full" onClick={() => onToggleSave(item)}>
                  <Heart className={`mr-2 h-4 w-4 ${item.viewerHasSaved ? "fill-current" : ""}`} />
                  {item.viewerHasSaved ? "Saved" : "Save Item"}
                </Button>
              </div>

              <div className="rounded-[18px] border border-[#3f5f55]/14 bg-[#3f5f55]/8 p-4 text-[11px] leading-5 text-[#2f5147] dark:text-[#b6d2c9]">
                <div className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Meet in a public place for local pickup. Never send money before receiving the item.</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold">Reviews from buyers</div>
                  {detail?.totalReviews ? (
                    <button type="button" className="text-xs text-cortex-garnet underline-offset-4 hover:underline dark:text-cortex-gold">
                      View all {detail.totalReviews} reviews
                    </button>
                  ) : null}
                </div>
                {detail?.reviews.length ? detail.reviews.map((review) => <ReviewRow key={review.id} review={review} />) : (
                  <div className="rounded-[18px] border border-black/8 bg-white/34 p-4 text-xs text-black/52 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/56">
                    No buyer reviews yet.
                  </div>
                )}
                {detail?.viewerCanReview && detail.viewerReviewOrderId ? (
                  <Button variant="secondary" className="w-full" onClick={() => setReviewOpen(true)}>
                    Leave a review
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reviewOpen && detail?.viewerReviewOrderId ? (
        <ReviewModal
          orderId={detail.viewerReviewOrderId}
          onClose={() => setReviewOpen(false)}
          onPosted={() => {
            onToast("Review posted.");
            void queryClient.invalidateQueries({ queryKey: ["marketplace-item", itemId] });
          }}
        />
      ) : null}
    </div>
  );
}
