import Image from "next/image";

import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { AvatarColorPreset } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  imageUrl,
  avatarColor,
  size = "md",
  className
}: {
  name: string;
  imageUrl?: string;
  avatarColor?: AvatarColorPreset;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sizeClass = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg"
  }[size];
  const fallbackPalette = getAvatarColorClasses(name, avatarColor);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-semibold shadow-[0_10px_24px_rgba(18,17,15,0.08)]",
        imageUrl
          ? "border-black/6 bg-[#f4efe8] text-cortex-ink dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
          : fallbackPalette,
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
        <span className="relative z-10">{initials || "CU"}</span>
      )}
    </div>
  );
}