"use client";

import Image from "next/image";

import { getFeedAvatarInitials, getFeedAvatarPalette } from "@/components/feed/helpers";
import { cn } from "@/lib/utils";

export function FeedAvatar({
  name,
  imageUrl,
  size = "md",
  className
}: {
  name: string;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = getFeedAvatarInitials(name) || "GV";
  const palette = getFeedAvatarPalette(name);
  const sizeClass = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg"
  }[size];

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/8 font-semibold shadow-[0_10px_24px_rgba(18,17,15,0.08)] dark:border-white/10",
        imageUrl ? "bg-[#f4efe8] text-cortex-ink dark:bg-white/[0.08] dark:text-white" : `${palette.backgroundClass} ${palette.textClass}`,
        sizeClass,
        className
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} profile`}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="relative z-10">{initials}</span>
      )}
    </div>
  );
}