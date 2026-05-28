import Image from "next/image";

import groveLogo from "@/logo_b.png";
import { cn } from "@/lib/utils";

export function BrandMark({
  variant = "sidebar",
  className
}: {
  variant?: "sidebar" | "header";
  className?: string;
}) {
  if (variant === "header") {
    return (
      <div
        className={cn(
          "relative h-[42px] w-[42px] overflow-hidden rounded-full border border-black/6 bg-[#f4efe8] shadow-[0_10px_24px_rgba(18,17,15,0.08)] dark:border-white/10 dark:bg-white/[0.08]",
          className
        )}
      >
        <Image
          src={groveLogo}
          alt="Grove logo"
          fill
          priority
          sizes="42px"
          className="object-contain p-1.5 dark:brightness-0 dark:invert"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-[74px] w-[184px] overflow-hidden", className)}>
      <Image
        src={groveLogo}
        alt="Grove logo"
        fill
        priority
        sizes="184px"
        className="object-cover object-[50%_44%] drop-shadow-[0_18px_28px_rgba(18,17,15,0.12)] dark:brightness-0 dark:invert dark:drop-shadow-[0_22px_34px_rgba(0,0,0,0.28)]"
      />
    </div>
  );
}
