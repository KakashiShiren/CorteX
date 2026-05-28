"use client";

import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { MarketplaceItem } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

function conditionClass(condition?: string) {
  if (condition === "Like New") {
    return "border-[#3f5f55]/20 bg-[#3f5f55]/10 text-[#2f5147] dark:text-[#b6d2c9]";
  }

  if (condition === "Good") {
    return "border-[#ba7517]/20 bg-[#ba7517]/10 text-[#8a5814] dark:text-[#f0c37f]";
  }

  return "border-black/10 bg-black/[0.04] text-black/54 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/58";
}

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

export function MarketplaceCard({
  item,
  mode = "browse",
  isListView,
  onOpen,
  onToggleSave,
  onMessage,
  onEdit,
  onDelete,
  onMarkSold
}: {
  item: MarketplaceItem;
  mode?: "browse" | "mine";
  isListView?: boolean;
  onOpen: (item: MarketplaceItem) => void;
  onToggleSave?: (item: MarketplaceItem) => void;
  onMessage?: (item: MarketplaceItem) => void;
  onEdit?: (item: MarketplaceItem) => void;
  onDelete?: (item: MarketplaceItem) => void;
  onMarkSold?: (item: MarketplaceItem) => void;
}) {
  const imageUrl = item.imageUrls[0];
  const sold = item.status === "sold" || !item.isAvailable;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[24px] border border-black/9 bg-[#fffaf3]/68 shadow-[0_16px_34px_rgba(18,17,15,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-black/18 hover:shadow-[0_22px_46px_rgba(18,17,15,0.1)] dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/18",
        isListView ? "grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)]" : ""
      )}
    >
      <button type="button" onClick={() => onOpen(item)} className="relative block w-full overflow-hidden bg-black/[0.04] text-left dark:bg-white/[0.04]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            className={cn("w-full object-cover transition duration-300 group-hover:scale-[1.02]", isListView ? "h-full min-h-[190px]" : "max-h-[250px] min-h-[210px]")}
          />
        ) : (
          <div className={cn("grid w-full place-items-center text-sm text-black/46 dark:text-white/48", isListView ? "h-full min-h-[190px]" : "h-[220px]")}>
            No image
          </div>
        )}
        {item.imageUrls.length > 1 ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/68 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            1/{item.imageUrls.length}
          </span>
        ) : null}
        {sold ? (
          <span className="absolute left-3 top-3 rounded-full bg-cortex-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cortex-parchment">
            Sold
          </span>
        ) : null}
      </button>

      <div className="flex min-h-[220px] flex-col p-4">
        <button type="button" onClick={() => onOpen(item)} className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-cortex-ink dark:text-white">{item.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {item.condition ? (
                  <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]", conditionClass(item.condition))}>
                    {item.condition}
                  </span>
                ) : null}
                <span className="rounded-full border border-black/8 bg-white/42 px-2 py-0.5 text-[10px] text-black/48 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/48">
                  {item.category}
                </span>
              </div>
            </div>
            <div className="text-right text-base font-bold text-cortex-garnet dark:text-cortex-gold">{formatCurrency(item.price)}</div>
          </div>
        </button>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-black/54 dark:text-white/56">
          <Avatar name={item.seller.name} imageUrl={item.seller.profilePictureUrl} avatarColor={item.seller.avatarColor} size="sm" className="h-6 w-6 text-[10px]" />
          <span className="min-w-0 truncate">
            {item.seller.name} · ★ {item.seller.rating.toFixed(1)} ({item.seller.reviewsCount} reviews)
          </span>
        </div>

        <div className="mt-3 text-[11px] text-black/46 dark:text-white/48">{timeAgo(item.createdAt)}</div>

        {mode === "mine" ? (
          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-black/52 dark:text-white/56">
              <span className="rounded-full border border-black/8 bg-white/42 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]">
                {sold ? "Sold" : item.status === "draft" ? "Draft" : "Active"}
              </span>
              <span>{item.viewsCount} views</span>
              <span>{item.interestedCount} people interested</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <Button variant="secondary" size="sm" onClick={() => onEdit?.(item)} aria-label="Edit item">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onMarkSold?.(item)} disabled={sold} aria-label="Mark as sold">
                Sold
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onDelete?.(item)} aria-label="Delete item">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-5">
            <button
              type="button"
              onClick={() => onToggleSave?.(item)}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border transition",
                item.viewerHasSaved
                  ? "border-cortex-ember/20 bg-cortex-ember/10 text-cortex-ember"
                  : "border-black/8 bg-white/44 text-black/58 hover:bg-white/76 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60"
              )}
              aria-label={item.viewerHasSaved ? "Unsave item" : "Save item"}
            >
              <Heart className={cn("h-4 w-4", item.viewerHasSaved ? "fill-current" : "")} />
            </button>
            <button
              type="button"
              onClick={() => onMessage?.(item)}
              className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/44 text-black/58 transition hover:bg-white/76 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60"
              aria-label="Message seller"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
