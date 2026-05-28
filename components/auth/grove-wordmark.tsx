import Image from "next/image";

import groveLogo from "@/logo_b.png";
import { cn } from "@/lib/utils";

export function GroveWordmark({
  tone = "light",
  compact = false,
  className
}: {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  const isDarkTone = tone === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        compact ? "h-[54px] w-[150px]" : "h-[72px] w-[200px]",
        className
      )}
    >
      <Image
        src={groveLogo}
        alt="Grove logo"
        fill
        priority
        sizes={compact ? "150px" : "200px"}
        className={cn(
          "object-cover object-[50%_44%] drop-shadow-[0_14px_24px_rgba(18,17,15,0.10)]",
          isDarkTone ? "brightness-0" : "brightness-0 invert"
        )}
      />
    </div>
  );
}
