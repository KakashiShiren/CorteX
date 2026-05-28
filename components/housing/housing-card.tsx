"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle } from "lucide-react";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import { Button } from "@/components/ui/button";
import type { HousingPost } from "@/lib/housing";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDistance(distance?: number) {
  if (distance === undefined) {
    return "Near campus";
  }

  return `${distance.toFixed(distance < 1 ? 1 : 1)} miles from Clark`;
}

export function HousingCard({
  listing,
  isFavorite,
  onOpen,
  onToggleFavorite,
  onInquire
}: {
  listing: HousingPost;
  isFavorite: boolean;
  onOpen: (listing: HousingPost) => void;
  onToggleFavorite: (listing: HousingPost) => void;
  onInquire: (listing: HousingPost) => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = listing.imagesUrl;
  const activeImage = images[imageIndex % Math.max(1, images.length)];

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [images.length]);

  const amenities = listing.amenities.slice(0, 4);
  const description =
    listing.description && listing.description.length > 80
      ? `${listing.description.slice(0, 80).trim()}...`
      : listing.description;

  return (
    <article className="cortex-panel hover-lift group overflow-hidden rounded-[12px] border border-black/8 p-0 transition hover:border-[#1E5A3A]/50 dark:border-white/10 dark:hover:border-[#8FD4AC]/36">
      <div className="h-[3px] w-full bg-[#1E5A3A]" />
      <div
        role="button"
        tabIndex={0}
        className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-cortex-gold"
        onClick={() => onOpen(listing)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(listing);
          }
        }}
      >
        <div className="relative h-[200px] overflow-hidden bg-[#e9dfd0]">
          {activeImage ? (
            <img src={activeImage} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#e9dfd0] text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Housing
            </div>
          )}
          {images.length > 1 ? (
            <>
              <div className="absolute right-3 top-3 rounded-full bg-black/54 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {imageIndex + 1}/{images.length}
              </div>
              <button
                type="button"
                className="absolute left-2 top-1/2 rounded-full bg-white/84 p-1 text-cortex-ink opacity-0 transition group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  setImageIndex((current) => (current - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 rounded-full bg-white/84 p-1 text-cortex-ink opacity-0 transition group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  setImageIndex((current) => (current + 1) % images.length);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[14px] font-semibold text-cortex-ink dark:text-white">
              {formatPrice(listing.pricePerMonth)}/mo - {listing.bedrooms ?? "?"} bed, {listing.bathrooms ?? "?"} bath
            </div>
            <div className="shrink-0 text-right text-[10px] font-semibold text-[#1E5A3A] dark:text-[#8FD4AC]">
              {formatDistance(listing.distanceMiles)}
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[12px] text-black/54 dark:text-white/56">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1E5A3A] dark:text-[#8FD4AC]" />
            <span>{listing.location}</span>
          </div>

          {amenities.length ? (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((amenity) => (
                <span key={amenity} className="rounded-full border border-black/8 bg-white/56 px-2 py-1 text-[9px] font-semibold text-black/56 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                  {amenity}
                </span>
              ))}
            </div>
          ) : null}

          {description ? <p className="text-[11px] leading-5 text-black/54 dark:text-white/56">{description}</p> : null}

          <div className="flex items-center gap-2">
            <FeedAvatar name={listing.author.name} imageUrl={listing.author.profilePictureUrl} size="xs" />
            <div className="min-w-0 text-[11px] text-black/52 dark:text-white/56">
              <span className="font-semibold text-cortex-ink dark:text-white">{listing.author.name}</span>
              {listing.author.year ? ` - ${listing.author.year}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-black/6 px-4 py-3 dark:border-white/8">
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
            isFavorite ? "text-[#9f1d2c]" : "text-black/48 hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
          }`}
          onClick={() => onToggleFavorite(listing)}
        >
          <Heart className="h-3.5 w-3.5" fill={isFavorite ? "currentColor" : "none"} />
          <span>{listing.likesCount}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-black/48 transition hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
          onClick={() => onOpen(listing)}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{listing.commentsCount}</span>
        </button>
        <Button size="sm" className="ml-auto" onClick={() => onInquire(listing)}>
          Inquire Now
        </Button>
      </div>
    </article>
  );
}
