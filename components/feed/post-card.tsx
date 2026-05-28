"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, MoreHorizontal, ThumbsUp } from "lucide-react";

import { FeedAvatar } from "@/components/feed/feed-avatar";
import {
  deriveEventTitle,
  formatEventDate,
  formatPostAge,
  getPostTypeAccent,
  getPostTypeBadgeClass,
  getPostTypeLabel,
  isEventLikeType,
  shouldShowFreeChip
} from "@/components/feed/helpers";
import { PostComments } from "@/components/feed/post-comments";
import { Button } from "@/components/ui/button";
import type { FeedPost } from "@/lib/types";

export function PostCard({
  post,
  currentUserId,
  currentUserName,
  currentUserImageUrl,
  onToggleLike,
  onChangeRsvp,
  onDelete,
  onError,
  isBusy,
  isHighlighted,
  isRemoving
}: {
  post: FeedPost;
  currentUserId?: string;
  currentUserName: string;
  currentUserImageUrl?: string;
  onToggleLike: (post: FeedPost) => void;
  onChangeRsvp: (post: FeedPost, nextStatus: "going" | "not_interested" | null) => void;
  onDelete: (post: FeedPost) => void;
  onError: (message: string) => void;
  isBusy?: boolean;
  isHighlighted?: boolean;
  isRemoving?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const accentColor = getPostTypeAccent(post.postType);
  const eventLike = isEventLikeType(post.postType);
  const eventTitle = eventLike ? deriveEventTitle(post.content, post.eventLocation) : undefined;
  const bodyText =
    eventTitle && post.content.startsWith(eventTitle) ? post.content.slice(eventTitle.length).trim() : post.content;
  const isOwnPost = currentUserId === post.userId;

  useEffect(() => {
    setCommentsCount(post.commentsCount);
  }, [post.commentsCount]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <article
      id={`post-${post.id}`}
      className={`cortex-panel hover-lift group relative overflow-hidden border border-black/8 p-0 transition-all duration-300 hover:border-black/14 dark:border-white/10 dark:hover:border-white/16 ${
        isHighlighted ? "ring-2 ring-cortex-gold/40 ring-offset-2 ring-offset-transparent" : ""
      } ${isRemoving ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <FeedAvatar
              name={post.isAnonymous ? "Anonymous" : post.author.name}
              imageUrl={post.isAnonymous ? undefined : post.author.profilePictureUrl}
              size="sm"
            />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-cortex-ink dark:text-white">
                {post.isAnonymous ? "Anonymous" : post.author.name}
              </div>
              {!post.isAnonymous && (post.author.major || post.author.year) ? (
                <div className="mt-1 truncate text-[11px] text-black/48 dark:text-white/52">
                  {[post.author.major, post.author.year].filter(Boolean).join(" - ")}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex flex-col items-end gap-2">
              <div className="text-[11px] text-black/46 dark:text-white/50">{formatPostAge(post.createdAt)}</div>
              <div
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.4px] ${getPostTypeBadgeClass(post.postType)}`}
              >
                {getPostTypeLabel(post.postType)}
              </div>
            </div>

            {isOwnPost ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen((current) => !current);
                    setConfirmDelete(false);
                  }}
                  className="rounded-full border border-black/8 bg-white/76 p-2 text-black/56 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62 dark:hover:bg-white/[0.08]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-60 rounded-[20px] border border-black/8 bg-[#fbf6ee]/96 p-3 shadow-[0_20px_42px_rgba(18,17,15,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1817]/96">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-[#9f1d2c] transition hover:bg-[#f8e7ea] dark:text-[#ffb2bc] dark:hover:bg-white/[0.04]"
                      >
                        Delete post
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-cortex-ink dark:text-white">
                          Are you sure? This cannot be undone.
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => {
                              setConfirmDelete(false);
                              setMenuOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-[#9f1d2c] text-white hover:bg-[#861724] dark:bg-[#9f1d2c] dark:text-white"
                            onClick={() => onDelete(post)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {post.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-[22px] border border-black/6 dark:border-white/8">
            <img
              src={post.imageUrl}
              alt=""
              loading="lazy"
              className="max-h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.015]"
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {eventTitle ? (
            <div className="font-display text-[15px] font-semibold leading-6 text-cortex-ink dark:text-white">
              {eventTitle}
            </div>
          ) : null}
          <p className="text-[13px] leading-[1.65] text-black/68 dark:text-white/72">{bodyText}</p>
          {eventLike && (post.eventDate || post.eventLocation || shouldShowFreeChip(post.content)) ? (
            <div className="flex flex-wrap gap-2">
              {post.eventDate ? (
                <div className="inline-flex items-center gap-2 rounded-[6px] bg-[#E8E1D6] px-2 py-[3px] text-[10px] font-semibold text-[#7A7065]">
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
                  {formatEventDate(post.eventDate)}
                </div>
              ) : null}
              {post.eventLocation ? (
                <div className="inline-flex items-center gap-2 rounded-[6px] bg-[#E8E1D6] px-2 py-[3px] text-[10px] font-semibold text-[#7A7065]">
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
                  {post.eventLocation}
                </div>
              ) : null}
              {shouldShowFreeChip(post.content) ? (
                <div className="inline-flex items-center gap-2 rounded-[6px] bg-[#E8E1D6] px-2 py-[3px] text-[10px] font-semibold text-[#7A7065]">
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
                  Free
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/6 pt-4 dark:border-white/8">
          {eventLike ? (
            <>
              <Button
                size="sm"
                variant={post.viewerRsvpStatus === "going" ? "default" : "outline"}
                className={`min-w-[96px] ${
                  post.viewerRsvpStatus === "not_interested"
                    ? "opacity-45 hover:border-black/10 hover:bg-transparent dark:hover:bg-transparent"
                    : ""
                }`}
                disabled={isBusy || post.viewerRsvpStatus === "not_interested"}
                onClick={() => onChangeRsvp(post, post.viewerRsvpStatus === "going" ? null : "going")}
              >
                {post.viewerRsvpStatus === "going" ? (
                  <>
                    Going <Check className="ml-1 h-3.5 w-3.5" />
                  </>
                ) : (
                  "I'm In"
                )}
              </Button>
              <Button
                size="sm"
                variant={post.viewerRsvpStatus === "not_interested" ? "secondary" : "outline"}
                className={`min-w-[108px] ${
                  post.viewerRsvpStatus === "not_interested" ? "text-black/58 dark:text-white/62" : ""
                }`}
                disabled={isBusy}
                onClick={() =>
                  onChangeRsvp(post, post.viewerRsvpStatus === "not_interested" ? null : "not_interested")
                }
              >
                {post.viewerRsvpStatus === "not_interested" ? "Not Going" : "Not Interested"}
              </Button>
              <button
                type="button"
                className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-black/48 transition hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
                onClick={() => setCommentsOpen((current) => !current)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{commentsCount}</span>
              </button>
              <div className="ml-auto text-xs text-black/48 dark:text-white/52">{post.rsvpGoingCount} going</div>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant={post.viewerHasLiked ? "default" : "outline"}
                className="min-w-[88px]"
                disabled={isBusy}
                onClick={() => onToggleLike(post)}
              >
                <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                {post.likesCount}
              </Button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-black/48 transition hover:bg-black/[0.04] dark:text-white/52 dark:hover:bg-white/[0.05]"
                onClick={() => setCommentsOpen((current) => !current)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{commentsCount}</span>
              </button>
            </>
          )}
        </div>

        <PostComments
          postId={post.id}
          currentUserName={currentUserName}
          currentUserImageUrl={currentUserImageUrl}
          open={commentsOpen}
          onError={onError}
          onCountChange={setCommentsCount}
        />
      </div>
    </article>
  );
}
