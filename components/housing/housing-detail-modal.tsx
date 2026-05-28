"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Share2 } from "lucide-react";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import { formatPostAge } from "@/components/feed/helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { HousingComment, HousingPost } from "@/lib/housing";

type CommentsResponse = {
  comments: HousingComment[];
  total: number;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Date TBD";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatDistance(distance?: number) {
  if (distance === undefined) {
    return "Near Clark University";
  }

  return `${distance.toFixed(1)} miles from Clark University`;
}

export function HousingDetailModal({
  listing,
  currentUserId,
  currentUserName,
  currentUserImageUrl,
  isFavorite,
  onClose,
  onToggleFavorite,
  onInquire,
  onError
}: {
  listing: HousingPost | null;
  currentUserId?: string;
  currentUserName: string;
  currentUserImageUrl?: string;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (listing: HousingPost) => void;
  onInquire: (listing: HousingPost) => void;
  onError: (message: string) => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const commentsQuery = useQuery({
    queryKey: ["housing-comments", listing?.id],
    queryFn: () => apiFetch<CommentsResponse>(`/api/housing/${listing!.id}/comments`),
    enabled: Boolean(listing?.id),
    staleTime: 15_000
  });

  useEffect(() => {
    if (!listing) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setImageIndex(0);
    setShowPhone(false);
    setContent("");

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [listing]);

  useEffect(() => {
    if (!listing?.id) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`housing-comments:${listing.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "housing_comments",
          filter: `housing_post_id=eq.${listing.id}`
        },
        () => {
          void commentsQuery.refetch();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [commentsQuery, listing?.id]);

  useEffect(() => {
    if (!listing || listing.imagesUrl.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % listing.imagesUrl.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [listing]);

  if (!listing) {
    return null;
  }

  const images = listing.imagesUrl;
  const activeImage = images[imageIndex % Math.max(1, images.length)];
  const comments = commentsQuery.data?.comments ?? [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/44 p-3 backdrop-blur-[2px] sm:p-5">
      <div className="mx-auto flex min-h-full max-w-6xl items-start justify-center py-4">
        <div className="cortex-panel max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-[24px] p-0 sm:max-h-[calc(100vh-3rem)]">
          <div className="relative h-[300px] overflow-hidden bg-[#e9dfd0]">
            {activeImage ? (
              <img src={activeImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#e9dfd0]" />
            )}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 rounded-full bg-white/88 p-2 text-cortex-ink"
                  onClick={() => setImageIndex((current) => (current - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 rounded-full bg-white/88 p-2 text-cortex-ink"
                  onClick={() => setImageIndex((current) => (current + 1) % images.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute right-4 top-4 rounded-full bg-black/56 px-3 py-1 text-[11px] font-semibold text-white">
                  {imageIndex + 1}/{images.length}
                </div>
              </>
            ) : null}
            <Button variant="secondary" className="absolute left-4 top-4" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_270px] lg:p-7">
            <div className="space-y-6">
              <div>
                <h2 className="text-[18px] font-semibold text-cortex-ink dark:text-white">
                  {formatPrice(listing.pricePerMonth)}/mo · {listing.bedrooms ?? "?"} bed, {listing.bathrooms ?? "?"} bath
                </h2>
                <div className="mt-2 text-[12px] text-black/56 dark:text-white/58">📍 {listing.location}</div>
                <div className="mt-1 text-[11px] font-semibold text-[#1E5A3A] dark:text-[#8FD4AC]">
                  {formatDistance(listing.distanceMiles)}
                </div>
              </div>

              {listing.amenities.length ? (
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full border border-black/8 bg-white/56 px-2 py-1 text-[9px] font-semibold text-black/56 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : null}

              {listing.description ? (
                <p className="text-[13px] leading-7 text-black/64 dark:text-white/68">{listing.description}</p>
              ) : null}

              <div className="grid gap-3 rounded-[18px] border border-black/8 bg-white/54 p-4 text-[12px] text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62 sm:grid-cols-2">
                <div>Type: {listing.leaseLength || "Negotiable"}</div>
                <div>Available from: {formatDate(listing.availableFrom)}</div>
                <div>Email: {listing.contactEmail || "Hidden"}</div>
                <div>
                  Phone:{" "}
                  {listing.contactPhone ? (
                    showPhone ? (
                      listing.contactPhone
                    ) : (
                      <button type="button" className="font-semibold text-[#1E5A3A]" onClick={() => setShowPhone(true)}>
                        Show phone
                      </button>
                    )
                  ) : (
                    "Not listed"
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FeedAvatar name={listing.author.name} imageUrl={listing.author.profilePictureUrl} size="sm" />
                <div className="text-[11px] text-black/52 dark:text-white/56">
                  <div>
                    Posted by <span className="font-semibold text-cortex-ink dark:text-white">{listing.author.name}</span>
                    {listing.author.year ? ` · ${listing.author.year}` : ""}
                  </div>
                  <div className="mt-1">Date posted: {formatPostAge(listing.createdAt)}</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-black/6 pt-5 dark:border-white/8">
                <div className="text-[13px] font-semibold text-cortex-ink dark:text-white">Questions & Comments</div>
                {commentsQuery.isLoading ? (
                  <div className="text-sm text-black/52 dark:text-white/56">Loading comments...</div>
                ) : comments.length ? (
                  comments.slice(-3).map((comment) => (
                    <div key={comment.id} className="flex gap-3 rounded-[18px] border border-black/6 bg-white/54 p-3 dark:border-white/8 dark:bg-white/[0.04]">
                      <FeedAvatar name={comment.author.name} imageUrl={comment.author.profilePictureUrl} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[11px] font-semibold text-cortex-ink dark:text-white">{comment.author.name}</div>
                          <div className="text-[10px] text-black/42 dark:text-white/46">{formatPostAge(comment.createdAt)}</div>
                          {comment.userId === currentUserId ? (
                            <button
                              type="button"
                              className="ml-auto text-[10px] font-semibold text-[#9f1d2c]"
                              onClick={async () => {
                                try {
                                  await apiFetch<{ success: boolean }>(`/api/housing/${listing.id}/comments/${comment.id}`, {
                                    method: "DELETE"
                                  });
                                  await commentsQuery.refetch();
                                } catch (error) {
                                  onError(error instanceof Error ? error.message : "Unable to delete comment.");
                                }
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-1 text-[12px] leading-6 text-black/64 dark:text-white/68">{comment.content}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-black/10 px-4 py-4 text-sm italic text-black/50 dark:border-white/10 dark:text-white/54">
                    No comments yet. Ask the first question.
                  </div>
                )}

                <div className="flex gap-3">
                  <FeedAvatar name={currentUserName} imageUrl={currentUserImageUrl} size="xs" />
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value.slice(0, 300))}
                      placeholder="Ask a question or share your thoughts"
                      className="min-h-[82px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!content.trim() || isPosting}
                        onClick={async () => {
                          try {
                            setIsPosting(true);
                            await apiFetch<{ comment: HousingComment }>(`/api/housing/${listing.id}/comments`, {
                              method: "POST",
                              body: JSON.stringify({ content: content.trim() })
                            });
                            setContent("");
                            await commentsQuery.refetch();
                          } catch (error) {
                            onError(error instanceof Error ? error.message : "Unable to post comment.");
                          } finally {
                            setIsPosting(false);
                          }
                        }}
                      >
                        {isPosting ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <Button className="w-full" onClick={() => onInquire(listing)}>
                Message Landlord
              </Button>
              <Button variant="outline" className="w-full" onClick={() => onToggleFavorite(listing)}>
                <Heart className="mr-2 h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
              <div className="rounded-[18px] border border-black/8 bg-white/54 p-4 text-[12px] text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4" />
                  <span>{listing.likesCount}</span>
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentsQuery.data?.total ?? listing.commentsCount}</span>
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </div>
              </div>
              <div className="rounded-[18px] border border-black/8 bg-white/54 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <FeedAvatar name={listing.author.name} imageUrl={listing.author.profilePictureUrl} size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-cortex-ink dark:text-white">{listing.author.name}</div>
                    <div className="mt-1 text-[11px] text-black/52 dark:text-white/56">
                      {[listing.author.year, listing.author.major].filter(Boolean).join(" · ") || "Grove student"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-[11px] text-black/54 dark:text-white/56">
                  <div>Response rate: 95%</div>
                  <div>Joined {formatPostAge(listing.author.id ? listing.createdAt : new Date().toISOString())}</div>
                </div>
              </div>
              <div className="rounded-[18px] border border-[#1E5A3A]/18 bg-[#1E5A3A]/8 p-4 text-[11px] leading-5 text-[#1E5A3A] dark:text-[#8FD4AC]">
                🛡️ Always meet the landlord in person and never send money until you've signed.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
