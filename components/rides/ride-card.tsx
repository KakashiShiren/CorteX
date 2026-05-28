"use client";

import { ArrowRight, CalendarDays, MapPin, MessageCircle, ThumbsUp, Users } from "lucide-react";
import { format } from "date-fns";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import { formatPostAge } from "@/components/feed/helpers";
import { Button } from "@/components/ui/button";
import type { RidePost } from "@/lib/rides";

function formatRideDate(value?: string, flexible?: boolean) {
  if (flexible) {
    return "Flexible timing";
  }

  if (!value) {
    return "Timing TBD";
  }

  return format(new Date(value), "EEEE, MMM d 'at' h:mm a");
}

function formatCost(value?: number, passenger = false) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return passenger ? "Budget open" : "Cost TBD";
  }

  return passenger ? `Up to $${Math.round(value)} per person` : `$${Math.round(value)} per seat`;
}

export function RideCard({
  ride,
  onRequest,
  onOffer
}: {
  ride: RidePost;
  onRequest: (ride: RidePost) => void;
  onOffer: (ride: RidePost) => void;
}) {
  const isDriverPost = ride.postType === "driver";
  const peopleCount = ride.seatsAvailable ?? 1;

  return (
    <article className="cortex-panel hover-lift group relative overflow-hidden border border-black/8 p-0 transition hover:border-[#8B6914]/48 dark:border-white/10 dark:hover:border-[#8B6914]/36">
      <div className="absolute left-0 top-0 h-full w-[3px] bg-[#8B6914]" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <FeedAvatar name={ride.author.name} imageUrl={ride.author.profilePictureUrl} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-cortex-ink dark:text-white">
                {ride.author.name}
              </div>
              <div className="mt-1 truncate text-[11px] text-black/48 dark:text-white/52">
                {[ride.author.major, ride.author.year].filter(Boolean).join(" - ") || "Grove student"}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-black/46 dark:text-white/50">
            {formatPostAge(ride.createdAt)}
          </div>
        </div>

        {ride.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-[20px] border border-black/6 dark:border-white/8">
            <img
              src={ride.imageUrl}
              alt=""
              className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {isDriverPost ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-cortex-ink dark:text-white">
                <MapPin className="h-4 w-4 text-[#8B6914] dark:text-[#8B6914]" />
                <span>{ride.departureLocation || "Campus"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-black/36 dark:text-white/38" />
                <span>{ride.destination || "Destination TBD"}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] text-black/58 dark:text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatRideDate(ride.departureTime)}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-cortex-ink dark:text-white">
                  <Users className="h-3.5 w-3.5" />
                  {peopleCount} seat{peopleCount === 1 ? "" : "s"} available
                </span>
              </div>
              <div className="text-[13px] font-semibold text-[#8B6914] dark:text-[#8B6914]">
                {formatCost(ride.costPerSeat)}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-cortex-ink dark:text-white">
                <Users className="h-4 w-4 text-[#8B6914] dark:text-[#8B6914]" />
                Looking for a ride
              </div>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-cortex-ink dark:text-white">
                <MapPin className="h-4 w-4 text-[#8B6914] dark:text-[#8B6914]" />
                {ride.destination || "Destination TBD"}
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] text-black/58 dark:text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatRideDate(ride.departureTime, ride.flexibleTiming)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {peopleCount} people looking
                </span>
              </div>
              <div className="text-[13px] font-semibold text-[#8B6914] dark:text-[#8B6914]">
                {formatCost(ride.costPerSeat, true)}
              </div>
            </>
          )}

          {ride.description ? (
            <p className="text-[12px] leading-6 text-black/58 dark:text-white/60">{ride.description}</p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/6 pt-4 dark:border-white/8">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-black/48 transition hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{ride.likesCount}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-black/48 transition hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{ride.commentsCount}</span>
          </button>
          <Button size="sm" className="ml-auto" onClick={() => (isDriverPost ? onRequest(ride) : onOffer(ride))}>
            {isDriverPost ? "Request Seat" : "Offer Ride"}
          </Button>
        </div>
      </div>
    </article>
  );
}
